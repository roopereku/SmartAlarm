#ifndef TCP_CLIENT_HH
#define TCP_CLIENT_HH

#include "pico/stdlib.h"
#include "pico/cyw43_arch.h"
#include "lwip/pbuf.h"
#include "lwip/tcp.h"

#include "Config.hh"

#include <functional>
#include <string>

class TCPClient
{
public:
	TCPClient();

	void update();
	bool connect(Config& cfg);

	void sendMessage(const std::string& message);
	std::function <void(const std::string&)> onMessage;

	static err_t recv(void *arg, struct tcp_pcb *tpcb, struct pbuf *p, err_t err);
	static err_t connected(void *arg, struct tcp_pcb *tpcb, err_t err);
	static err_t sent(void* arg, tcp_pcb* pcb, u16_t len);
	static err_t poll(void* arg, tcp_pcb* pcb);
	static void err(void *arg, err_t err);

private:
    tcp_pcb *pcb = nullptr;

    bool isWifiConnected = false;
    bool isServerConnected = false;

	std::string message;
};

#endif
