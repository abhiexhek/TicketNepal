package com.ticketnepal.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel; // <-- Important
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QrCodeService {

    public byte[] generateQrCode(String data, int width, int height) throws WriterException, IOException {
        if (data == null || data.isEmpty()) {
            throw new IllegalArgumentException("QR code contents must not be null or empty");
        }
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.Q); // High error correction (25%)

        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height, hints);

        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
    }

    public byte[] generateQrCodeForTickets(List<Map<String, String>> ticketDetails, int width, int height) throws WriterException, IOException {
        // For transaction QR codes, we should use the transaction ID, not the full ticket details
        // The transaction ID should be passed as the first parameter to this method
        // For now, we'll extract it from the first ticket's details if available
        String transactionId = ticketDetails.isEmpty() ? "" : ticketDetails.get(0).get("transactionId");
        if (transactionId == null || transactionId.isEmpty()) {
            // Fallback: generate a simple transaction identifier
            transactionId = "TXN_" + System.currentTimeMillis();
        }
        return generateQrCode(transactionId, width, height);
    }
}
