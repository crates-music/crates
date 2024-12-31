package page.crates.service;

import page.crates.entity.Library;
import page.crates.service.enums.LibrarySyncOption;

public interface LibrarySyncService {
    Library markSyncInProgress(LibrarySyncOption... options);

    Library synchronize(LibrarySyncOption... options);
}
