package com.example.guestbook.entry;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

    public record ErrorBody(String code, String message) {
    }

    @ExceptionHandler(BannedWordException.class)
    ResponseEntity<ErrorBody> bannedWord(BannedWordException e) {
        return badRequest("BANNED_WORD", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> invalidBody(MethodArgumentNotValidException e) {
        return badRequest("VALIDATION", "이름은 1~20자, 메시지는 한 줄 1~300자로 입력해 주세요.");
    }

    @ExceptionHandler({InvalidRequestException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorBody> invalidRequest(Exception e) {
        return badRequest("VALIDATION", "요청 값이 올바르지 않습니다.");
    }

    private static ResponseEntity<ErrorBody> badRequest(String code, String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorBody(code, message));
    }
}
