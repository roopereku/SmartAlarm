//
// Created by kkivi on 22/11/2022.
//

#include <cstdio>
#include "hardware/timer.h"
#include "pico/stdlib.h"
#include "hardware/gpio.h"
#include "pico/time.h"

int main() {
    stdio_init_all();
    gpio_init(28);
    gpio_set_dir(28, GPIO_IN);

    while (true) {
        printf("%d\n", gpio_get(28));
    }


}




/*
int ledPin = 13;                // choose the pin for the LED
int inputPin = 2;               // choose the input pin
int val = 0;                    // variable for reading the pin status
void setup() {
    pinMode(ledPin, OUTPUT);      // declare LED as output
    pinMode(inputPin, INPUT);     // declare pushbutton as input
}

void loop() {
    val = digitalRead(inputPin);  // read input value
    if (val == HIGH) {            // check if the input is HIGH
        digitalWrite(ledPin, LOW);  // turn LED OFF
    } else {
        digitalWrite(ledPin, HIGH); // turn LED ON
    }
}
  */