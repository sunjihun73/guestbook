package com.example.guestbook.entry;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:sqlite:build/test-api.db",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "guestbook.banned-words=욕설"
})
class EntryControllerTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    EntryRepository repository;
    @Autowired
    ObjectMapper json;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    private ResultActions postEntry(String name, String message) throws Exception {
        return mvc.perform(post("/api/entries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", name, "message", message))));
    }

    private void saveMany(String name, int count) {
        for (int i = 1; i <= count; i++) {
            repository.save(new Entry(name, "메시지 " + i));
        }
    }

    @Test
    void post_validEntry_returns201AndAppearsFirstInList() throws Exception {
        postEntry("민수", "안녕하세요")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("민수"))
                .andExpect(jsonPath("$.message").value("안녕하세요"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.createdAt").isString());

        mvc.perform(get("/api/entries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entries[0].message").value("안녕하세요"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void post_bannedWordInMessage_returns400BannedWordAndStoresNothing() throws Exception {
        postEntry("민수", "이건 욕설 입니다")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BANNED_WORD"))
                .andExpect(jsonPath("$.message").value("사용할 수 없는 단어가 포함되어 있습니다."));

        mvc.perform(get("/api/entries"))
                .andExpect(jsonPath("$.entries").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void post_bannedWordInName_returns400BannedWord() throws Exception {
        postEntry("욕설맨", "안녕")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BANNED_WORD"));
    }

    @Test
    void post_blankName_returns400Validation() throws Exception {
        postEntry("   ", "안녕")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void post_whitespaceOnlyMessage_returns400Validation() throws Exception {
        postEntry("민수", "   ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
        mvc.perform(get("/api/entries")).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void post_missingFields_returns400Validation() throws Exception {
        mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void post_messageWithNewline_returns400Validation() throws Exception {
        postEntry("민수", "첫 줄\n둘째 줄")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void post_name21Chars_returns400() throws Exception {
        postEntry("가".repeat(21), "안녕").andExpect(status().isBadRequest());
    }

    @Test
    void post_name20Chars_returns201() throws Exception {
        postEntry("가".repeat(20), "안녕").andExpect(status().isCreated());
    }

    @Test
    void post_message301Chars_returns400() throws Exception {
        postEntry("민수", "가".repeat(301))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void post_message300Chars_returns201() throws Exception {
        postEntry("민수", "가".repeat(300)).andExpect(status().isCreated());
    }

    @Test
    void post_trimsSurroundingWhitespace() throws Exception {
        postEntry("  민수  ", "  안녕  ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("민수"))
                .andExpect(jsonPath("$.message").value("안녕"));
    }

    @Test
    void get_returns20PerPage() throws Exception {
        saveMany("민수", 25);

        mvc.perform(get("/api/entries"))
                .andExpect(jsonPath("$.entries.length()").value(20))
                .andExpect(jsonPath("$.entries[0].message").value("메시지 25"))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.page").value(0));
        mvc.perform(get("/api/entries").param("page", "1"))
                .andExpect(jsonPath("$.entries.length()").value(5))
                .andExpect(jsonPath("$.page").value(1));
    }

    @Test
    void get_pageBeyondLast_returnsEmptyList() throws Exception {
        saveMany("민수", 3);

        mvc.perform(get("/api/entries").param("page", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entries").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void get_negativePage_returns400() throws Exception {
        mvc.perform(get("/api/entries").param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void get_nonNumericPage_returns400() throws Exception {
        mvc.perform(get("/api/entries").param("page", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void get_nameFilter_returnsOnlyMatchingNamesPaged() throws Exception {
        saveMany("김민수", 21);
        saveMany("이영희", 4);

        mvc.perform(get("/api/entries").param("name", "민수"))
                .andExpect(jsonPath("$.entries.length()").value(20))
                .andExpect(jsonPath("$.totalElements").value(21))
                .andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get("/api/entries").param("name", "민수").param("page", "1"))
                .andExpect(jsonPath("$.entries.length()").value(1))
                .andExpect(jsonPath("$.entries[0].name").value("김민수"));
    }

    @Test
    void get_blankName_listsEverything() throws Exception {
        saveMany("민수", 2);

        mvc.perform(get("/api/entries").param("name", "  "))
                .andExpect(jsonPath("$.totalElements").value(2));
    }
}
