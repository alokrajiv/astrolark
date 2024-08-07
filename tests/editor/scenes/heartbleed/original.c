#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define BUF_SIZE 64 * 1024

typedef struct {
    unsigned char *data;
    size_t length;
} Buffer;

typedef struct {
    unsigned char type;
    unsigned int payload;
    unsigned short length;
} HeartbeatMessage;

void process_heartbeat_message(HeartbeatMessage *hb, Buffer *recv_buf, Buffer *send_buf) {
    unsigned char *p = hb->payload;
    unsigned short payload_length = hb->length;

    // Copy payload data to send buffer
    memcpy(send_buf->data, p, payload_length);

    // Send response
    send_heartbeat_response(send_buf);
}

void send_heartbeat_response(Buffer *send_buf) {
    // Send the heartbeat response back to the requester
    // (Implementation omitted for brevity)
}

HeartbeatMessage *parse_heartbeat_message(Buffer *recv_buf) {
    HeartbeatMessage *hb = malloc(sizeof(HeartbeatMessage));
    if (!hb) {
        fprintf(stderr, "Memory allocation failed\n");
        return NULL;
    }

    // Parse heartbeat message
    hb->type = recv_buf->data[0];
    hb->payload = (recv_buf->data[1] << 8) | recv_buf->data[2];
    hb->length = (recv_buf->data[3] << 8) | recv_buf->data[4];
    hb->payload = recv_buf->data + 5;

    return hb;
}

int main() {
    Buffer recv_buf;
    Buffer send_buf;
    HeartbeatMessage *hb_msg;

    recv_buf.data = malloc(BUF_SIZE);
    send_buf.data = malloc(BUF_SIZE);

    if (!recv_buf.data || !send_buf.data) {
        fprintf(stderr, "Memory allocation failed\n");
        return 1;
    }

    // Simulate receiving a heartbeat message
    // (Details omitted for brevity)

    hb_msg = parse_heartbeat_message(&recv_buf);

    if (hb_msg) {
        process_heartbeat_message(hb_msg, &recv_buf, &send_buf);
        free(hb_msg);
    }

    free(recv_buf.data);
    free(send_buf.data);

    return 0;
}
