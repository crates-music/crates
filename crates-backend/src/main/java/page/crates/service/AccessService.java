package page.crates.service;

import page.crates.entity.Crate;

public interface AccessService {
    void assertAccess(Crate crate);
}
