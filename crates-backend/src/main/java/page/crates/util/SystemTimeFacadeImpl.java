package page.crates.util;

import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SystemTimeFacadeImpl implements SystemTimeFacade {
    @Override
    public Instant now() {
        return Instant.now();
    }
}
