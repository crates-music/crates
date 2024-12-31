package page.crates.util;

import page.crates.entity.SpotifyUser;
import page.crates.security.UserContextHolder;

public final class DelegatingUserContextRunnable implements Runnable {
    private final Runnable delegate;
    private final SpotifyUser delegateContext;
    private SpotifyUser originalContext;

    public DelegatingUserContextRunnable(final Runnable delegate, final SpotifyUser delegateContext) {
        this.delegate = delegate;
        this.delegateContext = delegateContext;
    }

    @Override
    public void run() {
        originalContext = UserContextHolder.getUserContext();
        try {
            UserContextHolder.setUserContext(delegateContext);
            delegate.run();
        } finally {
            UserContextHolder.setUserContext(originalContext);
        }
    }
}
