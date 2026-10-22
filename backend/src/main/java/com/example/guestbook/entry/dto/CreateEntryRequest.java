package com.example.guestbook.entry.dto;

import com.example.guestbook.text.UnicodeSpace;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateEntryRequest(
        @NotBlank @Size(max = 20) String name,
        @NotBlank @Size(max = 300) @Pattern(regexp = "[^\r\n]*") String message) {

    public CreateEntryRequest {
        name = name == null ? null : UnicodeSpace.stripEdges(name);
        message = message == null ? null : UnicodeSpace.stripEdges(message);
    }
}
