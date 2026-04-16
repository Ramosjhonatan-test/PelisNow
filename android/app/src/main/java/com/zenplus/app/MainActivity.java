package com.zenplus.app;

import android.content.Intent; // Importación necesaria para manejar los Intentos
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void startActivity(Intent intent) {
        // Verificamos si el intento es para abrir una dirección URL (ACTION_VIEW)
        if (intent.getAction() != null && intent.getAction().equals(Intent.ACTION_VIEW)) {

            // Verificamos si la URL NO pertenece a tu dominio permitido (videasy)
            // Esto es un filtro extra de seguridad nativa
            String dataString = intent.getDataString();
            if (dataString != null && !dataString.contains("videasy.net")) {
                // Si el anuncio intenta abrir CUALQUER otra cosa, bloqueamos el inicio
                return;
            }
        }

        // Si es una acción interna de la app, permitimos que continúe
        super.startActivity(intent);
    }
}