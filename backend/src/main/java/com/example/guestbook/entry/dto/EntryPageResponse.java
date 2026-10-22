package com.example.guestbook.entry.dto;

import java.util.List;

public record EntryPageResponse(List<EntryResponse> entries, int page, int totalPages, long totalElements) {
}
