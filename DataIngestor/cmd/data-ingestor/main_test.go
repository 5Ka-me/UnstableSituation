package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWeatherData_Unmarshal(t *testing.T) {
	jsonData := `{
		"id": 1,
		"temperature": 25.5,
		"humidity": 60.0,
		"pressure": 1013.25,
		"location": "Moscow",
		"timestamp": "2023-12-01T12:00:00Z"
	}`

	var weatherData WeatherData
	err := json.Unmarshal([]byte(jsonData), &weatherData)
	require.NoError(t, err)

	assert.Equal(t, 1, weatherData.ID)
	assert.Equal(t, 25.5, weatherData.Temperature)
	assert.Equal(t, 60.0, weatherData.Humidity)
	assert.Equal(t, 1013.25, weatherData.Pressure)
	assert.Equal(t, "Moscow", weatherData.Location)
	assert.Equal(t, "2023-12-01T12:00:00Z", weatherData.Timestamp.Format(time.RFC3339))
}

func TestDataIngestor_FetchDataFromAPI(t *testing.T) {
	// Create a mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/weather" {
			weatherData := WeatherData{
				ID:          1,
				Temperature: 25.5,
				Humidity:    60.0,
				Pressure:    1013.25,
				Location:    "Moscow",
				Timestamp:   time.Now(),
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(weatherData)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	config := &Config{
		API: APIConfig{
			BaseURL: server.URL,
			Timeout: 5 * time.Second,
		},
		Logging: LoggingConfig{
			Level: "debug",
		},
	}

	ingestor := NewDataIngestor(config)

	ctx := context.Background()
	data, err := ingestor.FetchDataFromAPI(ctx)

	require.NoError(t, err)
	assert.Equal(t, 1, data.ID)
	assert.Equal(t, 25.5, data.Temperature)
	assert.Equal(t, "Moscow", data.Location)
}

func TestDataIngestor_FetchDataFromAPI_Error(t *testing.T) {
	// Create a mock server that returns error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	config := &Config{
		API: APIConfig{
			BaseURL: server.URL,
			Timeout: 5 * time.Second,
		},
		Logging: LoggingConfig{
			Level: "debug",
		},
	}

	ingestor := NewDataIngestor(config)

	ctx := context.Background()
	_, err := ingestor.FetchDataFromAPI(ctx)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "API returned status 500")
}

func TestConfig_LoadConfig(t *testing.T) {
	config, err := LoadConfig("config.yaml")
	require.NoError(t, err)

	assert.Equal(t, "8080", config.Server.Port)
	assert.Equal(t, "0.0.0.0", config.Server.Host)
	assert.Equal(t, "http://weakapp:5000", config.API.BaseURL)
	assert.Equal(t, 30*time.Second, config.API.Timeout)
	assert.Equal(t, 3, config.API.RetryCount)
	assert.Equal(t, "amqp://guest:guest@rabbitmq:5672/", config.RabbitMQ.URL)
	assert.Equal(t, "weather_data", config.RabbitMQ.QueueName)
	assert.Equal(t, "info", config.Logging.Level)
}

func TestWeatherData_Marshal(t *testing.T) {
	weatherData := WeatherData{
		ID:          1,
		Temperature: 25.5,
		Humidity:    60.0,
		Pressure:    1013.25,
		Location:    "Moscow",
		Timestamp:   time.Date(2023, 12, 1, 12, 0, 0, 0, time.UTC),
	}

	data, err := json.Marshal(weatherData)
	require.NoError(t, err)

	var unmarshaled WeatherData
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, weatherData, unmarshaled)
}


