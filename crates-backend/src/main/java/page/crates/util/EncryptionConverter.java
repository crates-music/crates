package page.crates.util;

import jakarta.persistence.AttributeConverter;
import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Value;
import page.crates.exception.EncryptionException;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;

@SuppressWarnings("squid:S4432")
public class EncryptionConverter implements AttributeConverter<String, String> {
    private static final String ALGORITHM = "AES/ECB/PKCS5Padding";
    private final Key key;

    public EncryptionConverter(@Value("${crates.encryption-key}") String secretKey) {
        this.key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        try {
            Cipher c = Cipher.getInstance(ALGORITHM);
            c.init(Cipher.ENCRYPT_MODE, key);
            return Base64.encodeBase64String(c.doFinal(attribute.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new EncryptionException(e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        try {
            Cipher c = Cipher.getInstance(ALGORITHM);
            c.init(Cipher.DECRYPT_MODE, key);
            return new String(c.doFinal(Base64.decodeBase64(dbData)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new EncryptionException(e);
        }
    }
}