package com.example.guestbook.entry;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntryRepository extends JpaRepository<Entry, Long> {

    Page<Entry> findByNameContaining(String name, Pageable pageable);
}
