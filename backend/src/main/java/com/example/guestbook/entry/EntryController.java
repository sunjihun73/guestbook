package com.example.guestbook.entry;

import com.example.guestbook.entry.dto.CreateEntryRequest;
import com.example.guestbook.entry.dto.EntryPageResponse;
import com.example.guestbook.entry.dto.EntryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/entries")
public class EntryController {

    private final EntryService service;

    public EntryController(EntryService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EntryResponse create(@Valid @RequestBody CreateEntryRequest request) {
        return service.create(request.name(), request.message());
    }

    @GetMapping
    public EntryPageResponse list(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page) {
        return service.list(name, page);
    }
}
