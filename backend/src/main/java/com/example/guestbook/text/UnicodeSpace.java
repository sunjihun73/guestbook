package com.example.guestbook.text;

import java.util.regex.Pattern;

/**
 * Whitespace handling that also covers Unicode spaces (full-width space, no-break space)
 * and zero-width characters, which {@link String#trim()} and a plain {@code \s} miss.
 */
public final class UnicodeSpace {

    private static final String SPACE_OR_INVISIBLE = "[\\p{Z}\\s\\u200B-\\u200D\\uFEFF]";
    private static final Pattern ANY = Pattern.compile(SPACE_OR_INVISIBLE + "+");
    private static final Pattern EDGES = Pattern.compile("^" + SPACE_OR_INVISIBLE + "+|" + SPACE_OR_INVISIBLE + "+$");

    private UnicodeSpace() {
    }

    /** Removes leading and trailing spaces. */
    public static String stripEdges(String text) {
        return EDGES.matcher(text).replaceAll("");
    }

    /** Removes every space and invisible character. */
    public static String removeAll(String text) {
        return ANY.matcher(text).replaceAll("");
    }
}
