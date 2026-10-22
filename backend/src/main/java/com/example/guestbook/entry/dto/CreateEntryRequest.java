package com.example.guestbook.entry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateEntryRequest(
        @NotBlank @Size(max = 20) String name,
        @NotBlank @Size(max = 300) @Pattern(regexp = "[^\r\n]*") String message) {

    public CreateEntryRequest {
        name = name == null ? null : name.trim();
        message = message == null ? null : message.trim();
    }
}
