#include "TCPClient.hh"

//#define TEST_TCP_SERVER_IP "192.168.1.145"
//#define WIFI_SSID "E-P:n kone ja tarvike"
//#define WIFI_PASSWORD "M3YG3RD9LMBDA"

#define TEST_TCP_SERVER_IP "192.168.91.111"
#define WIFI_SSID "OnePlus Nord N10 5G"
#define WIFI_PASSWORD "salsasana666"

#define TCP_PORT 4242

TCPClient::TCPClient() {}
void TCPClient::update() { cyw43_arch_poll(); }

void TCPClient::sendMessage(const std::string& message)
{
	err_t err = tcp_write(pcb, message.c_str(), message.size(), TCP_WRITE_FLAG_COPY);

	if (err != ERR_OK)
		printf("Failed to write data %d\n", err);
}

bool TCPClient::connect()
{
	if(!isWifiConnected && cyw43_arch_wifi_connect_timeout_ms(WIFI_SSID, WIFI_PASSWORD, CYW43_AUTH_WPA2_AES_PSK, 30000))
	{
		printf("failed to connect.\n");
		return false;
	}

	isWifiConnected = true;

	ip_addr_t remote_addr;
	ip4addr_aton(TEST_TCP_SERVER_IP, &remote_addr);

	printf("Connecting to %s port %u\n", ip4addr_ntoa(&remote_addr), TCP_PORT);
	pcb = tcp_new_ip_type(IP_GET_TYPE(&state->remote_addr));

	if(!pcb)
	{
		printf("failed to create pcb\n");
		return false;
	}

	tcp_arg(pcb, this);
	tcp_poll(pcb, poll, 0);
	tcp_sent(pcb, sent);
	tcp_recv(pcb, recv);
	tcp_err(pcb, err);

	cyw43_arch_lwip_begin();
	err_t err = tcp_connect(pcb, &remote_addr, TCP_PORT, connected);
	cyw43_arch_lwip_end();

	isServerConnected = err == ERR_OK;
	return isServerConnected;
}

err_t TCPClient::recv(void *arg, struct tcp_pcb *tpcb, struct pbuf *p, err_t err)
{
	if (!p) return ERR_OK;

	cyw43_arch_lwip_check();
	if(p->tot_len > 0)
	{
		printf("recv %d err %d\n", p->tot_len, err);
		// Receive the buffer
		char buffer[2048];
		size_t buffer_len = pbuf_copy_partial(p, buffer, p->tot_len, 0);

		TCPClient* obj = static_cast <TCPClient*> (arg);
		obj->message = std::string(buffer, buffer_len);
		if(obj->onMessage) obj->onMessage(obj->message);

		tcp_recved(tpcb, p->tot_len);
	}

	pbuf_free(p);
	return ERR_OK;
}

err_t TCPClient::connected(void *arg, struct tcp_pcb *tpcb, err_t err)
{
	printf("Check connected\n");

	if (err != ERR_OK)
	{
		printf("connect failed %d\n", err);
		return err;
	}

	//static_cast <TCPClient*> (arg)->isConnected = true;
	printf("2 Waiting for buffer from server\n");
	return ERR_OK;
}

err_t TCPClient::sent(void* arg, tcp_pcb* pcb, u16_t len)
{
	printf("tcp_client_sent %u\n", len);
	return ERR_OK;
}

err_t TCPClient::poll(void* arg, tcp_pcb* pcb)
{
	//printf("tcp_client_poll\n");
	return ERR_OK;
}

void TCPClient::err(void *arg, err_t err)
{ 
	printf("tcp_client_err %d\n", err);
}
