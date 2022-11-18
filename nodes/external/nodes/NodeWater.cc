/*
 * TODO: Make class and inherit BaseNode
 * TODO: Modify to sleep until i2c is receiving data
 */

#include <cstdio>
#include "pico/stdlib.h"
#include "pico/binary_info.h"
#include "hardware/i2c.h"
#include "NodeBase.hh"

class NodeWater : public NodeBase {
public:
    NodeWater(const char *name) : NodeBase("water", name, NodeContext::Action, 0) {
        // This example will use I2C0 on the default SDA and SCL pins (GP4, GP5 on a Pico)
        i2c_init(i2c_default, 100 * 1000);
        gpio_set_function(PICO_DEFAULT_I2C_SDA_PIN, GPIO_FUNC_I2C);
        gpio_set_function(PICO_DEFAULT_I2C_SCL_PIN, GPIO_FUNC_I2C);
        gpio_pull_up(PICO_DEFAULT_I2C_SDA_PIN);
        gpio_pull_up(PICO_DEFAULT_I2C_SCL_PIN);

        // Make the I2C pins available to picotool
        bi_decl(bi_2pins_with_func(PICO_DEFAULT_I2C_SDA_PIN, PICO_DEFAULT_I2C_SCL_PIN, GPIO_FUNC_I2C))
    }

    bool check(Params &params) override {
        int attiny1_high_addr = 0x78;
        int attiny2_low_addr = 0x77;
        uint8_t data;

        for (int i = 0; i < 8; i++) {
            i2c_read_blocking(i2c_default, attiny2_low_addr, &data, 1, true);
        }
        for (int i = 0; i < 12; i++) {
            i2c_read_blocking(i2c_default, attiny1_high_addr, &data, 1, true);
        }
        auto &cmp = params["comparison"];
        return cmp == ">" ? data >= 0 : data < 1;
    }
};

int main() {
    NodeWater node("water1");
    node.run();
}


