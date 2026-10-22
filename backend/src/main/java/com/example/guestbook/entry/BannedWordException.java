package com.example.guestbook.entry;

public class BannedWordException extends RuntimeException {

    public BannedWordException() {
        super("사용할 수 없는 단어가 포함되어 있습니다.");
    }
}
