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
        "spring.datasource.url=jdbc:sqlite:build/test-unicode.db",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "guestbook.banned-words=욕설"
})
class EntryUnicodeWhitespaceTest {

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

    @Test
    void post_fullWidthSpaceOnlyName_returns400() throws Exception {
        postEntry("　", "안녕")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }

    @Test
    void post_noBreakSpaceOnlyMessage_returns400() throws Exception {
        postEntry("민수", "  ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
        mvc.perform(get("/api/entries")).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void post_trimsUnicodeSpacesAroundValues() throws Exception {
        postEntry("　민수 ", "　안녕 ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("민수"))
                .andExpect(jsonPath("$.message").value("안녕"));
    }

    @Test
    void post_bannedWordSplitByTabOrFullWidthSpace_returns400() throws Exception {
        postEntry("민수", "욕\t설").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BANNED_WORD"));
        postEntry("민수", "욕　설").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BANNED_WORD"));
    }
}
