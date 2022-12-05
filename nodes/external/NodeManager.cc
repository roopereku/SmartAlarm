#include "NodeManager.hh"

std::vector <std::shared_ptr <NodeBase>> Nodes::nodes;
unsigned Nodes::delay = 10;
Config Nodes::cfg;

void Nodes::setDelay(unsigned ms)
{
	delay = ms;
}

void Nodes::run()
{
	stdio_init_all();
    cyw43_arch_init();

	gpio_init(16);
	gpio_set_dir(16, GPIO_OUT);

	//	If the pico has USB power and the override is low, enter the config mode
	bool usbPower = cyw43_arch_gpio_get(2) && !gpio_get(16);
	if(usbPower) cfg.startReading();

	printf("run\n");
	connectNodes();

	while(true)
	{
		cyw43_arch_poll();

		for(auto& n : nodes)
			n->update();

		sleep_ms(delay);
	}
}

void Nodes::connectNodes()
{
	cyw43_arch_enable_sta_mode();
	cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 1);

	//	Loop while the wifi connection fails
	while(cyw43_arch_wifi_connect_timeout_ms(cfg.get("ssid").c_str(), cfg.get("pass").c_str(), CYW43_AUTH_WPA2_AES_PSK, 30000))
		printf("failed to connect.\n");

	for(auto& n : nodes)
		n->connect(cfg);

	cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 0);
}
