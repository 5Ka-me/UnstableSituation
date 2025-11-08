# Как проверить работу Notification Service

## 1. Проверка Health Check

```bash
curl http://localhost:3001/health
```

Ожидаемый ответ:
```json
{
  "status": "healthy",
  "service": "notification-service"
}
```

## 2. Проверка подключения к RabbitMQ

В логах должно быть:
```
Connected to RabbitMQ. Exchange: meter-data-exchange, Queue: meter-data-queue, RoutingKey: meter.data
Waiting for messages from RabbitMQ...
```

## 3. Проверка подключения к SignalR

В логах должно быть:
```
Connecting to SignalR Hub at http://localhost:5284/notificationsHub...
Connected to SignalR Hub successfully
```

## 4. Проверка получения данных

Когда данные приходят из RabbitMQ, в логах должно быть:
```
Received message from RabbitMQ: 18 sensor reading(s)
```

## 5. Проверка генерации уведомлений

Когда данные анализируются и генерируются уведомления:
```
Notification sent: warning - High PM2.5 level detected in Office: 39 µg/m³
Notification sent: info - Motion detected in Corridor
```

## 6. Проверка на фронтенде

1. Откройте фронтенд: http://localhost:3000
2. Откройте консоль браузера (F12)
3. Убедитесь, что SignalR подключен
4. Откройте панель уведомлений (иконка колокольчика)
5. Должны появляться уведомления в реальном времени

## 7. Предупреждение "No client method with the name 'notification' found"

Это предупреждение означает, что:
- Уведомление было отправлено через SignalR
- Но в данный момент нет подключенных клиентов, которые слушают это событие
- Это НЕ ошибка, просто информационное сообщение

Если фронтенд открыт и подключен к SignalR, это предупреждение не должно появляться.

## 8. Тестирование различных сценариев

### Высокий CO2
Когда CO2 > 800 ppm, должно появиться уведомление:
```
Notification sent: warning - High CO2 level detected in [Location]: [value] ppm
```

### Критический CO2
Когда CO2 > 1000 ppm:
```
Notification sent: error - Critical CO2 level detected in [Location]: [value] ppm
```

### Высокое потребление энергии
Когда energy > 800 kWh:
```
Notification sent: warning - High energy consumption detected in [Location]: [value] kWh
```

### Обнаружение движения
Когда motionDetected = true:
```
Notification sent: info - Motion detected in [Location]
```

## 9. Проверка в Docker

```bash
# Проверить логи
docker logs notification-service

# Проверить статус
docker ps | grep notification-service

# Проверить health check
docker inspect notification-service | grep Health -A 10
```

## 10. Отладка

Если уведомления не появляются:

1. Проверьте, что RabbitMQ получает данные:
   ```bash
   docker logs data-ingestor
   ```

2. Проверьте, что GraphQLGateway запущен:
   ```bash
   curl http://localhost:5284/graphql
   ```

3. Проверьте, что фронтенд подключен к SignalR:
   - Откройте консоль браузера
   - Должно быть: "SignalR connected successfully"

4. Проверьте логи notification-service:
   ```bash
   docker logs -f notification-service
   ```

