package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/streadway/amqp"
	"gopkg.in/yaml.v3"
)

// Config represents application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	API      APIConfig      `yaml:"api"`
	RabbitMQ RabbitMQConfig `yaml:"rabbitmq"`
	Logging  LoggingConfig  `yaml:"logging"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
	Host string `yaml:"host"`
}

type APIConfig struct {
	BaseURL    string        `yaml:"base_url"`
	Timeout    time.Duration `yaml:"timeout"`
	RetryCount int           `yaml:"retry_count"`
}

type RabbitMQConfig struct {
	URL       string `yaml:"url"`
	QueueName string `yaml:"queue_name"`
}

type LoggingConfig struct {
	Level string `yaml:"level"`
}

// WeatherData represents the structure of data from unstable API
type WeatherData struct {
	ID          int       `json:"id"`
	Temperature float64   `json:"temperature"`
	Humidity    float64   `json:"humidity"`
	Pressure    float64   `json:"pressure"`
	Location    string    `json:"location"`
	Timestamp   time.Time `json:"timestamp"`
}

// DataIngestor handles data ingestion from external API
type DataIngestor struct {
	config     *Config
	logger     *logrus.Logger
	httpClient *http.Client
	conn       *amqp.Connection
	channel    *amqp.Channel
}

// NewDataIngestor creates a new DataIngestor instance
func NewDataIngestor(config *Config) *DataIngestor {
	logger := logrus.New()
	level, err := logrus.ParseLevel(config.Logging.Level)
	if err != nil {
		level = logrus.InfoLevel
	}
	logger.SetLevel(level)

	httpClient := &http.Client{
		Timeout: config.API.Timeout,
	}

	return &DataIngestor{
		config:     config,
		logger:     logger,
		httpClient: httpClient,
	}
}

// ConnectToRabbitMQ establishes connection to RabbitMQ
func (di *DataIngestor) ConnectToRabbitMQ() error {
	var err error
	di.conn, err = amqp.Dial(di.config.RabbitMQ.URL)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	di.channel, err = di.conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare queue
	_, err = di.channel.QueueDeclare(
		di.config.RabbitMQ.QueueName,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	di.logger.Info("Connected to RabbitMQ successfully")
	return nil
}

// FetchDataFromAPI retrieves data from the unstable external API
func (di *DataIngestor) FetchDataFromAPI(ctx context.Context) (*WeatherData, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", di.config.API.BaseURL+"/weather", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := di.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var weatherData WeatherData
	if err := json.Unmarshal(body, &weatherData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Set timestamp if not provided
	if weatherData.Timestamp.IsZero() {
		weatherData.Timestamp = time.Now()
	}

	return &weatherData, nil
}

// PublishToQueue sends data to RabbitMQ queue
func (di *DataIngestor) PublishToQueue(data *WeatherData) error {
	body, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	err = di.channel.Publish(
		"",                        // exchange
		di.config.RabbitMQ.QueueName, // routing key
		false,                     // mandatory
		false,                     // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent, // make message persistent
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	di.logger.WithFields(logrus.Fields{
		"id":         data.ID,
		"location":   data.Location,
		"temperature": data.Temperature,
	}).Info("Data published to queue")

	return nil
}

// StartIngestion starts the data ingestion process
func (di *DataIngestor) StartIngestion(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second) // Fetch data every 5 seconds
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			di.logger.Info("Ingestion stopped")
			return
		case <-ticker.C:
			data, err := di.FetchDataFromAPI(ctx)
			if err != nil {
				di.logger.WithError(err).Error("Failed to fetch data from API")
				continue
			}

			if err := di.PublishToQueue(data); err != nil {
				di.logger.WithError(err).Error("Failed to publish data to queue")
				continue
			}

			di.logger.WithFields(logrus.Fields{
				"id":         data.ID,
				"location":   data.Location,
				"temperature": data.Temperature,
			}).Info("Successfully processed data")
		}
	}
}

// Close closes connections
func (di *DataIngestor) Close() error {
	if di.channel != nil {
		di.channel.Close()
	}
	if di.conn != nil {
		di.conn.Close()
	}
	return nil
}

// LoadConfig loads configuration from file
func LoadConfig(filename string) (*Config, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &config, nil
}

// setupRoutes sets up HTTP routes
func setupRoutes(di *DataIngestor) *gin.Engine {
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now(),
			"service":   "data-ingestor",
		})
	})

	// Manual trigger endpoint
	r.POST("/ingest", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		defer cancel()

		data, err := di.FetchDataFromAPI(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		if err := di.PublishToQueue(data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Data ingested successfully",
			"data":    data,
		})
	})

	return r
}

func main() {
	// Get config file path from command line argument or use default
	configPath := "config.yaml"
	if len(os.Args) > 1 && os.Args[1] == "-config" && len(os.Args) > 2 {
		configPath = os.Args[2]
	}

	// Load configuration
	config, err := LoadConfig(configPath)
	if err != nil {
		logrus.Fatalf("Failed to load config from %s: %v", configPath, err)
	}

	// Create data ingestor
	ingestor := NewDataIngestor(config)

	// Connect to RabbitMQ
	if err := ingestor.ConnectToRabbitMQ(); err != nil {
		logrus.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer ingestor.Close()

	// Setup HTTP server
	router := setupRoutes(ingestor)
	server := &http.Server{
		Addr:    config.Server.Host + ":" + config.Server.Port,
		Handler: router,
	}

	// Start HTTP server in goroutine
	go func() {
		ingestor.logger.WithField("addr", server.Addr).Info("Starting HTTP server")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			ingestor.logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Start data ingestion in goroutine
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go ingestor.StartIngestion(ctx)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ingestor.logger.Info("Shutting down server...")

	// Cancel ingestion context
	cancel()

	// Shutdown HTTP server
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		ingestor.logger.Errorf("Server forced to shutdown: %v", err)
	}

	ingestor.logger.Info("Server exited")
}
