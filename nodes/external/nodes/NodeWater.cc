#include <cstdio>
#include "pico/stdlib.h"
#include "pico/binary_info.h"
#include "hardware/i2c.h"
#include "NodeBase.hh"

// TODO: Make this interrupt driven, maximize the sleeping time
// TODO: Show numbers when sliding the threshold value

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

    bool check(Params &params) override {
        auto &cmp = params["Water level"];
        const uint16_t paramReal = atoi(params["Threshold [cm]"].c_str());
        uint32_t pads = 0;
        uint8_t trig_section = 0;
        float water_level;

        getHigh12Values();
        getLow8Values();
        printValues();

        // Check low pads
        for (int i = 0; i < 8; i++) {
            if (low_values[i] > threshold) {
                pads |= 1 << i;
            }
        }
        // Check high pads
        for (int i = 0; i < 12; i++) {
            if (high_values[i] > threshold) {
                pads |= (uint32_t) 1 << (8 + i);
            }
        }
        // Count how many pads are above the threshold
        while (pads & 0x01) {
            trig_section++;
            pads >>= 1;
        }

        water_level = trig_section * 5;
        if (water_level > 0) {
            printf("Water level: %.2f cm\n\n", (water_level / 10));
        }
        return cmp == ">" ? water_level >= paramReal : water_level < paramReal;
    }

    void setParamFormat(ParameterList &params) override {
        params["Threshold [cm]"].type = "number";

        params["Water level"].strictHints = true;
        params["Water level"].addHint(">", "Above the threshold");
        params["Water level"].addHint("<", "Below the threshold");
    }

    Status validateParams(Params &params) override {
        //	TODO report error when threshold is > 10 or < 0
        return Status(true);
    }

private:
    // Member variables
    int attiny1_high_addr = 0x78;
    int attiny2_low_addr = 0x77;
    unsigned char high_values[12] = {0};
    unsigned char low_values[8] = {0};
    int threshold = 100;

    static void blink() {
        cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, true);
        sleep_ms(50);
        cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, false);
        sleep_ms(50);
    }

    /* Measure values from the upper 12 pads */
    void getHigh12Values() {
        uint8_t value;
        for (unsigned char &i: high_values) {
            i2c_read_blocking(i2c_default, attiny1_high_addr, &value, 1, true);
            i = value;
        }
    }

    /* Measure values from the lower 8 pads (first pad is not measuring anything as it is a zero point) */
    void getLow8Values() {
        uint8_t value;
        for (unsigned char &i: low_values) {
            i2c_read_blocking(i2c_default, attiny2_low_addr, &value, 1, true);
            i = value;
        }
    }

    /* Print all measured high and low values*/
    void printValues() {
        printf("Low 8 values:\n");
        for (unsigned char low_value: low_values) {
            printf("%d.", low_value);
        }
        printf("\n\n");

        printf("High 12 values:\n");
        for (unsigned char high_value: high_values) {
            printf("%d.", high_value);
        }
        printf("\n\n");
    }
};


int main() {
    NodeWater node;
    node.run();
}