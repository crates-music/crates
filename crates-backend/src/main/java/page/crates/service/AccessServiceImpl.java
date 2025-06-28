package page.crates.service;

import org.springframework.stereotype.Service;
import page.crates.entity.Crate;
import page.crates.exception.UnauthorizedAccessException;

import jakarta.annotation.Resource;

@Service
public class AccessServiceImpl implements AccessService {
    @Resource
    private CurrentUserService currentUserService;

    @Override
    public void assertAccess(Crate crate) {
        final Long userId = currentUserService.getCurrentUser().getId();
        
        // Allow access if user owns the crate OR if the crate is public
        if (crate.getUser().getId().equals(userId) || crate.isPublicCrate()) {
            return;
        }
        
        throw new UnauthorizedAccessException();
    }
}
