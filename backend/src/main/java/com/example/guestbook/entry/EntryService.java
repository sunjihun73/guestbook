package com.example.guestbook.entry;

import com.example.guestbook.banned.BannedWordFilter;
import com.example.guestbook.entry.dto.EntryPageResponse;
import com.example.guestbook.entry.dto.EntryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class EntryService {

    static final int PAGE_SIZE = 20;

    private final EntryRepository repository;
    private final BannedWordFilter bannedWordFilter;

    public EntryService(EntryRepository repository, BannedWordFilter bannedWordFilter) {
        this.repository = repository;
        this.bannedWordFilter = bannedWordFilter;
    }

    public EntryResponse create(String name, String message) {
        if (bannedWordFilter.containsBannedWord(name) || bannedWordFilter.containsBannedWord(message)) {
            throw new BannedWordException();
        }
        return EntryResponse.from(repository.save(new Entry(name, message)));
    }

    public EntryPageResponse list(String nameOrNull, int page) {
        if (page < 0) {
            throw new InvalidRequestException("page는 0 이상이어야 합니다.");
        }
        String name = nameOrNull == null ? "" : nameOrNull.trim();
        PageRequest pageRequest = PageRequest.of(page, PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<Entry> result = repository.findByNameContaining(name, pageRequest);
        return new EntryPageResponse(
                result.getContent().stream().map(EntryResponse::from).toList(),
                page,
                result.getTotalPages(),
                result.getTotalElements());
    }
}
