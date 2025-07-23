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
        StringBuilder sb = new StringBuilder();
        for (Map<String, String> details : ticketDetails) {
            sb.append("Event: ").append(details.getOrDefault("eventName", "")).append("\n");
            sb.append("Date: ").append(details.getOrDefault("eventDate", "")).append("\n");
            sb.append("Seat: ").append(details.getOrDefault("seat", "")).append("\n");
            sb.append("Ticket ID: ").append(details.getOrDefault("ticketId", "")).append("\n");
            sb.append("---\n");
        }
        return generateQrCode(sb.toString(), width, height);
    }
}
