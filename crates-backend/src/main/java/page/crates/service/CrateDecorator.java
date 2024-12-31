package page.crates.service;

import page.crates.controller.api.Crate;

public interface CrateDecorator {
    Crate decorate(Crate crate);
}
