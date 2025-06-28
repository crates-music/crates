package page.crates.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.controller.api.UnifiedSearchResponse;
import page.crates.controller.api.mapper.CrateMapper;
import page.crates.controller.api.mapper.PublicUserMapper;
import page.crates.entity.Crate;
import page.crates.entity.SpotifyUser;
import page.crates.repository.CrateRepository;
import page.crates.repository.SpotifyUserRepository;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {
    
    private final SpotifyUserRepository userRepository;
    private final CrateRepository crateRepository;
    private final PublicUserMapper publicUserMapper;
    private final CrateMapper crateMapper;
    private final CrateDecorator crateDecorator;

    @Override
    @Transactional(readOnly = true)
    public UnifiedSearchResponse search(String query, Pageable pageable) {
        // Execute searches sequentially within the same transaction
        Page<SpotifyUser> usersPage = userRepository.searchUsers(query, pageable);
        Page<Crate> cratesPage = crateRepository.findAllPublicCratesWithUnifiedSearch(query, pageable);
        
        return UnifiedSearchResponse.builder()
            .users(publicUserMapper.toPublicUsers(usersPage.getContent()))
            .crates(cratesPage.getContent().stream()
                .map(crateMapper::map)
                .map(crateDecorator::decorate)
                .collect(Collectors.toList()))
            .build();
    }
}