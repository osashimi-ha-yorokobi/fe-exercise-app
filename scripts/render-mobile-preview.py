"""Static 390 px mobile layout preview based on the mock exam HTML/CSS."""
from PIL import Image, ImageDraw, ImageFont

OUT = "mobile-preview.png"
W, H, GAP, MARGIN = 390, 844, 22, 20
image = Image.new("RGB", (MARGIN * 2 + W * 3 + GAP * 2, 905), "#e7ebef")
draw = ImageDraw.Draw(image)
font_path = r"C:\Windows\Fonts\meiryo.ttc"
bold_path = r"C:\Windows\Fonts\meiryob.ttc"

def f(size, bold=False):
    return ImageFont.truetype(bold_path if bold else font_path, size)

def rect(xy, fill, radius=0, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def t(x, y, value, size=16, color="#122235", bold=False):
    draw.text((x, y), value, font=f(size, bold), fill=color)

def wrap(value, width, size):
    lines, line = [], ""
    for char in value:
        if draw.textlength(line + char, font=f(size)) > width and line:
            lines.append(line)
            line = char
        else:
            line += char
    if line:
        lines.append(line)
    return lines

def paragraph(x, y, value, width, size=14, step=23, color="#385066"):
    for line in wrap(value, width, size):
        t(x, y, line, size, color)
        y += step
    return y

def screen(offset, label):
    x = MARGIN + offset * (W + GAP)
    rect((x, 16, x + W, 16 + H), "#f2f5f8", radius=17)
    rect((x, 16, x + W, 74), "#12283f", radius=17)
    draw.rectangle((x, 55, x + W, 74), fill="#12283f")
    rect((x + 14, 27, x + 52, 65), "#27b4ac", radius=10)
    t(x + 22, 33, "FE", 18, "#092d3b", True)
    t(x + 64, 34, "FE UPDATE", 15, "#ffffff", True)
    t(x + 8, 874, label, 15, "#34495e", True)
    return x

x = screen(0, "開始画面（390 px）")
rect((x + 12, 92, x + 378, 828), "#ffffff", radius=18, outline="#dbe4ec")
t(x + 32, 115, "CBT PRACTICE TEST", 11, "#14837e", True)
t(x + 32, 146, "基本情報技術者試験", 23, bold=True)
t(x + 32, 181, "模擬試験 第2回", 23, bold=True)
y = paragraph(x + 32, 230, "現行シラバス Ver.9.2 の範囲から出題する全問新作の模試です。AI・データ活用、セキュリティなど近年追加された分野も多く扱います。", 322, 14, 25)
for title, body in [("科目A", "60問 / 90分 / 四肢択一"), ("科目B", "20問 / 100分 / 全問必須"), ("科目ごとに受験", "個別に開始・提出・採点")]:
    y += 13
    rect((x + 32, y, x + 358, y + 68), "#f6fbfc", radius=12, outline="#dbe8ed")
    t(x + 48, y + 7, title, 16, bold=True)
    t(x + 48, y + 34, body, 13, "#455e72")
    y += 68
y += 21
y = paragraph(x + 32, y, "番号からの問題移動、見直しマーク、未解答の確認に対応します。正解・解説は科目の終了後に表示します。", 322, 13, 23, "#53677b")
y += 20
rect((x + 32, y, x + 358, y + 48), "#126e85", radius=10)
t(x + 135, y + 10, "科目Aを開始", 16, "#ffffff", True)
y += 60
rect((x + 32, y, x + 358, y + 48), "#ffffff", radius=10, outline="#126e85")
t(x + 135, y + 10, "科目Bを開始", 16, "#126e85", True)

def exam_base(index, subject, title):
    x = screen(index, f"科目{subject}の受験画面（390 px）")
    t(x + 12, 100, f"第2回 科目{subject}", 17, bold=True)
    t(x + 12, 127, "模擬試験", 17, bold=True)
    rect((x + 263, 96, x + 378, 149), "#e5f4f3", radius=11)
    t(x + 289, 101, "残り時間", 11, "#0e5e60")
    t(x + 273, 120, "01:29:59" if subject == "A" else "01:39:59", 15, "#0e5e60", True)
    t(x + 12, 161, "1 / 60 問" if subject == "A" else "1 / 20 問", 12, "#50667a")
    rect((x + 12, 183, x + 378, 190), "#dce6ed", radius=3)
    rect((x + 12, 183, x + 20, 190), "#20a59f", radius=3)
    rect((x + 12, 207, x + 378, 758), "#ffffff", radius=18, outline="#dbe4ec")
    t(x + 28, 230, "問1", 15, "#13817b", True)
    rect((x + 240, 225, x + 360, 265), "#ffffff", radius=8, outline="#c4d4dd")
    t(x + 251, 233, "⚑ 後で見直す", 12, "#486074")
    y = paragraph(x + 28, 287, title, 330, 16, 27, "#122235")
    return x, y + 22

def toolbar(x, total):
    draw.rectangle((x, 785, x + W, 860), fill="#ffffff")
    draw.line((x, 785, x + W, 785), fill="#c8d8df", width=1)
    for xa, xb, label in [(x + 10, x + 72, "前へ"), (x + 78, x + 227, f"問題一覧 1/{total}"), (x + 233, x + 294, "次へ")]:
        rect((xa, 797, xb, 841), "#ffffff", radius=9, outline="#126e85")
        t(xa + 10, 807, label, 12, "#126e85", True)
    t(x + 301, 809, "01:29", 11, "#0e5e60", True)

x, y = exam_base(1, "A", "8ビットの符号なし整数の範囲はどれか。")
t(x + 28, y, "解答群", 13, "#577084", True)
y += 31
for kana, value in zip("アイウエ", ["－128～127", "0～255", "0～256", "－255～255"]):
    rect((x + 28, y, x + 362, y + 54), "#ffffff", radius=10, outline="#d4e0e8")
    draw.ellipse((x + 43, y + 18, x + 61, y + 36), outline="#8aa4b1", width=2)
    t(x + 74, y + 14, kana, 15, bold=True)
    t(x + 104, y + 14, value, 15)
    y += 65
t(x + 28, y + 4, "回答を取り消す", 12, "#8996a2")
toolbar(x, 60)

x, y = exam_base(2, "B", "配列a={7,3,5,1}について、i=1の回が終わった直後の配列はどれか。")
y = paragraph(x + 28, y, "手続 selectionSort は、未整列部分の最小値を探し、未整列部分の先頭と交換する。", 330, 13, 23)
y += 14
t(x + 28, y, "〔プログラム〕", 13, bold=True)
y += 28
rect((x + 28, y, x + 362, y + 233), "#f1f5f8", radius=2)
draw.rectangle((x + 28, y, x + 32, y + 233), fill="#48aaa9")
for line in ["○selectionSort(整数型の配列: a)", "  整数型: i, j, m, tmp", "  for (iを1からaの要素数－1まで)", "    m ← i", "    for (jをi＋1から要素数まで)", "      if (a[j]＜a[m])", "        m ← j", "      endif", "    endfor"]:
    t(x + 40, y + 9, line, 11, "#122235")
    y += 24
toolbar(x, 20)

image.save(OUT)
print(OUT)
