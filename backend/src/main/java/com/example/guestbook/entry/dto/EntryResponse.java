package com.example.guestbook.entry.dto;

import com.example.guestbook.entry.Entry;
import java.time.Instant;

public record EntryResponse(Long id, String name, String message, Instant createdAt) {

    public static EntryResponse from(Entry entry) {
        return new EntryResponse(entry.getId(), entry.getName(), entry.getMessage(), entry.getCreatedAt());
    }
}
