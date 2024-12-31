package page.crates.service;

import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class HandleServiceImpl implements HandleService {

    @Override
    public String handelize(String name) {
        // TODO: make this better.
        // TODO: check against existing ones for the current user.
        return name.trim().toLowerCase(Locale.ROOT).replace("\\s+", "-");
    }
}
