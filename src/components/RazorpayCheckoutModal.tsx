import React, { useMemo } from "react";
import { ActivityIndicator, Linking, Modal, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { RazorpayOrder, RazorpaySuccess } from "../services/payments";

export type RazorpayResult =
  | { status: "success"; payment: RazorpaySuccess }
  | { status: "failed"; description: string }
  | { status: "dismissed" };

export interface RazorpayCheckoutOptions {
  order: RazorpayOrder;
  description: string;
  method?: "upi" | "card" | "emi";
  prefill?: { name?: string; email?: string; contact?: string };
}

function buildHtml({ order, description, method, prefill }: RazorpayCheckoutOptions) {
  const options = {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: "Nufit",
    description,
    prefill: { ...prefill, method },
    theme: { color: colors.orange },
  };
  // Escape "<" so option values can't close the <script> tag.
  const json = JSON.stringify(options).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="background:transparent">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  function send(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  var options = ${json};
  options.handler = function (payment) { send({ status: "success", payment: payment }); };
  options.modal = { ondismiss: function () { send({ status: "dismissed" }); } };
  try {
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function (resp) {
      send({ status: "failed", description: (resp.error && resp.error.description) || "Payment failed" });
    });
    rzp.open();
  } catch (e) {
    send({ status: "failed", description: "Could not load Razorpay Checkout" });
  }
</script>
</body></html>`;
}

export default function RazorpayCheckoutModal({
  options,
  onResult,
}: {
  options: RazorpayCheckoutOptions | null;
  onResult: (result: RazorpayResult) => void;
}) {
  const html = useMemo(() => (options ? buildHtml(options) : ""), [options]);
  const insets = useSafeAreaInsets();

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      onResult(JSON.parse(e.nativeEvent.data) as RazorpayResult);
    } catch {
      onResult({ status: "failed", description: "Unexpected response from Razorpay" });
    }
  };

  return (
    <Modal visible={!!options} animationType="slide" onRequestClose={() => onResult({ status: "dismissed" })}>
      <View style={{ height: insets.top, backgroundColor: colors.orange }} />
      <View style={{ flex: 1, backgroundColor: colors.card, paddingBottom: insets.bottom }}>
        {options && (
          <WebView
            source={{ html, baseUrl: "https://checkout.razorpay.com" }}
            originWhitelist={["*"]}
            onMessage={onMessage}
            javaScriptEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={colors.orange} />
              </View>
            )}
            onShouldStartLoadWithRequest={(req) => {
              // UPI apps and other app deep links must leave the WebView.
              if (/^https?:|^about:|^data:/.test(req.url)) return true;
              Linking.openURL(req.url).catch(() => {});
              return false;
            }}
            style={{ flex: 1, backgroundColor: "transparent" }}
          />
        )}
      </View>
    </Modal>
  );
}
