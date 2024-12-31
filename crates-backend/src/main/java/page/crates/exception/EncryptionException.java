package page.crates.exception;

public class EncryptionException extends RuntimeException {
    private static final long serialVersionUID = 1294064591209098238L;

    public EncryptionException(final Throwable cause) {
        super(cause);
    }
}
