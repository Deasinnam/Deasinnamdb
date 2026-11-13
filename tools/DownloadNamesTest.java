import com.daesinnam.browser.DownloadNames;

/** 받을 파일 이름 규칙 점검 (CI에서 javac로 바로 실행) */
public class DownloadNamesTest {
    static int fail = 0;

    static void eq(String what, String got, String want) {
        boolean ok = want.equals(got);
        if (!ok) fail++;
        System.out.println((ok ? "PASS " : "FAIL ") + what + " → " + got + (ok ? "" : "  (기대: " + want + ")"));
    }

    public static void main(String[] a) {
        eq("filename* 한글", DownloadNames.choose("attachment; filename*=UTF-8''%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf", "https://x.com/d?id=1", null, "pdf"), "보고서.pdf");
        eq("filename*가 filename보다 우선", DownloadNames.choose("attachment; filename=\"report.pdf\"; filename*=UTF-8''%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf", null, null, null), "보고서.pdf");
        eq("따옴표 이름", DownloadNames.choose("attachment; filename=\"my file.zip\"", null, null, "zip"), "my file.zip");
        eq("따옴표 없는 이름", DownloadNames.choose("attachment;filename=data.csv", null, null, null), "data.csv");
        String broken = new String("문서.hwp".getBytes(java.nio.charset.StandardCharsets.UTF_8), java.nio.charset.StandardCharsets.ISO_8859_1);
        eq("깨진 UTF-8 이름 복구", DownloadNames.choose("attachment; filename=\"" + broken + "\"", null, null, null), "문서.hwp");
        eq("%로 적힌 이름", DownloadNames.choose("attachment; filename=\"%EC%82%AC%EC%A7%84.jpg\"", null, null, null), "사진.jpg");
        eq("주소에서 이름", DownloadNames.choose(null, "https://cdn.x.com/files/%ED%91%9C.xlsx?v=3#a", null, null), "표.xlsx");
        eq("확장자 없으면 붙임", DownloadNames.choose(null, "https://x.com/file", null, "pdf"), "file.pdf");
        eq("download.php → pdf", DownloadNames.choose(null, "https://x.com/download.php?id=9", null, "pdf"), "download.pdf");
        eq("blob은 페이지가 정한 이름", DownloadNames.choose(null, "blob:https://x.com/8f2c-11", "결과.txt", "txt"), "결과.txt");
        eq("data 주소 기본 이름", DownloadNames.choose(null, "data:image/png;base64,AAAA", null, "png"), "download.png");
        eq("경로·금지 문자 제거", DownloadNames.choose("attachment; filename=\"../../a<b>:c?.txt\"", null, null, null), "a<b>c.txt".replace("<", "").replace(">", ""));
        eq("숨김 파일 방지", DownloadNames.choose("attachment; filename=\".bashrc\"", null, null, null), "bashrc");
        eq("방향 뒤집기 문자 제거", DownloadNames.sanitize("photo‮gnp.exe"), "photognp.exe");
        StringBuilder longName = new StringBuilder();
        for (int i = 0; i < 300; i++) longName.append('가');
        String cut = DownloadNames.sanitize(longName + ".pdf");
        eq("긴 이름 자르고 확장자 유지", cut.length() + ":" + cut.endsWith(".pdf"), "120:true");
        eq("빈 이름", DownloadNames.sanitize("  ..  "), "download");
        if (fail > 0) {
            System.out.println("실패 " + fail + "개");
            System.exit(1);
        }
        System.out.println("파일 이름 규칙 모두 통과");
    }
}
