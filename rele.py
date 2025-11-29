import RPi.GPIO as GPIO
import time

PIN_RELE = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_RELE, GPIO.OUT)

try:
    # Pulso rápido
    GPIO.output(PIN_RELE, GPIO.LOW)   # Liga
    time.sleep(0.05)                  # 50 ms
    GPIO.output(PIN_RELE, GPIO.HIGH)  # Desliga
    print("Pulso enviado")

finally:
    GPIO.cleanup()

