#include <cstdio>
#include "pico/stdlib.h"
#include "pico/binary_info.h"
#include "hardware/i2c.h"
#include "NodeBase.hh"

class NodeWater : public NodeBase {
public:
    NodeWater() : NodeBase("water", NodeContext::Sensor, 100) {
        i2c_init(i2c_default, 100 * 1000); // I2C init
        gpio_set_function(PICO_DEFAULT_I2C_SDA_PIN, GPIO_FUNC_I2C); // GP4 pin
        gpio_set_function(PICO_DEFAULT_I2C_SCL_PIN, GPIO_FUNC_I2C); // GP5 pin
        gpio_pull_up(PICO_DEFAULT_I2C_SDA_PIN);
        gpio_pull_up(PICO_DEFAULT_I2C_SCL_PIN);

        // Make the I2C pins available to picotool
        // bi_decl(bi_2pins_with_func(PICO_DEFAULT_I2C_SDA_PIN, PICO_DEFAULT_I2C_SCL_PIN, GPIO_FUNC_I2C))
    }

    static void blink() {
        cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, true);
        sleep_ms(250);
        cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, false);
        sleep_ms(250);
    }

    bool getHigh12Values() {
        int attiny1_high_addr = 0x78;
        uint8_t result;

        for (int i = 0; i < 12; i++) {
            i2c_read_blocking(i2c_default, attiny1_high_addr, &result, 1, true);
            if (result > 0) {
                blink();
                return true;
            }
        }
        return false;
    }

    bool low7Values() {
        int attiny2_low_addr = 0x77;
        uint8_t result;

        for (int i = 0; i < 8; i++) {
            i2c_read_blocking(i2c_default, attiny2_low_addr, &result, 1, true);
            if (result > 0) {
                blink();
                return true;
            }
        }
        return false;
    }

    bool check(Params &params) override {
        bool water_detected;

        // Low address read
        water_detected = low7Values();
        if (!water_detected) {
            // High address read
            water_detected = getHigh12Values();
        }
        return water_detected;
    }
};

int main() {
    NodeWater node;
    node.run();
}


// Manufacturer's example code
/*
 #include <Wire.h>



#ifdef ARDUINO_SAMD_VARIANT_COMPLIANCE

#define SERIAL SerialUSB

#else

#define SERIAL Serial

#endif



unsigned char low_data[8] = {0};

unsigned char high_data[12] = {0};





#define NO_TOUCH       0xFE

#define THRESHOLD      100

#define ATTINY1_HIGH_ADDR   0x78

#define ATTINY2_LOW_ADDR   0x77



void getHigh12SectionValue(void)

{

  memset(high_data, 0, sizeof(high_data));

  Wire.requestFrom(ATTINY1_HIGH_ADDR, 12);

  while (12 != Wire.available());



  for (int i = 0; i < 12; i++) {

    high_data[i] = Wire.read();

  }

  delay(10);

}



void getLow8SectionValue(void)

{

  memset(low_data, 0, sizeof(low_data));

  Wire.requestFrom(ATTINY2_LOW_ADDR, 8);

  while (8 != Wire.available());



  for (int i = 0; i < 8 ; i++) {

    low_data[i] = Wire.read(); // receive a byte as character

  }

  delay(10);

}



void check()

{

  int sensorvalue_min = 250;

  int sensorvalue_max = 255;

  int low_count = 0;

  int high_count = 0;

  while (1)

  {

    uint32_t touch_val = 0;

    uint8_t trig_section = 0;

    low_count = 0;

    high_count = 0;

    getLow8SectionValue();

    getHigh12SectionValue();



    Serial.println("low 8 sections value = ");

    for (int i = 0; i < 8; i++)

    {

      Serial.print(low_data[i]);

      Serial.print(".");

      if (low_data[i] >= sensorvalue_min && low_data[i] <= sensorvalue_max)

      {

        low_count++;

      }

      if (low_count == 8)

      {

        Serial.print("      ");

        Serial.print("PASS");

      }

    }

    Serial.println("  ");

    Serial.println("  ");

    Serial.println("high 12 sections value = ");

    for (int i = 0; i < 12; i++)

    {

      Serial.print(high_data[i]);

      Serial.print(".");



      if (high_data[i] >= sensorvalue_min && high_data[i] <= sensorvalue_max)

      {

        high_count++;

      }

      if (high_count == 12)

      {

        Serial.print("      ");

        Serial.print("PASS");

      }

    }



    Serial.println("  ");

    Serial.println("  ");



    for (int i = 0 ; i < 8; i++) {

      if (low_data[i] > THRESHOLD) {

        touch_val |= 1 << i;



      }

    }

    for (int i = 0 ; i < 12; i++) {

      if (high_data[i] > THRESHOLD) {

        touch_val |= (uint32_t)1 << (8 + i);

      }

    }



    while (touch_val & 0x01)

    {

      trig_section++;

      touch_val >>= 1;

    }

    SERIAL.print("water level = ");

    SERIAL.print(trig_section * 5);

    SERIAL.println("% ");

    SERIAL.println(" ");

    SERIAL.println("*********************************************************");

    delay(1000);

  }

}



void setup() {

  SERIAL.begin(115200);

  Wire.begin();

}



void loop()

{

  check();

}
 */