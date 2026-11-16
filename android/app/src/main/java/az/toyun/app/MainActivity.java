package az.toyun.app;

import android.os.Bundle;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Sınaq (canlı rejim) APK-sının başlanğıc səhifəsi kompüteri Wi-Fi-da
        // axtarır. Səhifə telefonun öz ünvanını brauzerdən öyrənə bilmir,
        // ona görə buradan verilir: hansı şəbəkəni skan edəcəyini bilsin.
        getBridge().getWebView().addJavascriptInterface(new NetInfo(), "ToyunNet");
    }

    static class NetInfo {

        // Telefonun yerli şəbəkə ünvanları, vergüllə: "192.168.1.23,10.0.0.5"
        @JavascriptInterface
        public String addresses() {
            List<String> result = new ArrayList<>();
            try {
                for (NetworkInterface network : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                    if (!network.isUp() || network.isLoopback()) continue;
                    for (InetAddress address : Collections.list(network.getInetAddresses())) {
                        if (address instanceof Inet4Address && address.isSiteLocalAddress()) {
                            result.add(address.getHostAddress());
                        }
                    }
                }
            } catch (Exception ignored) {
                // Ünvan oxunmasa səhifə geniş yayılmış şəbəkələri yoxlayır
            }
            return String.join(",", result);
        }
    }
}
