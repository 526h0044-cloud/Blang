export interface CodePreset {
  id: string;
  name: string;
  description: string;
  code: string;
  isErrorDemo?: boolean;
}

export const PRESETS: CodePreset[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Tour',
    description: 'Khai báo biến trực tiếp (không dùng let), hàm, return, danh sách, từ điển, logic (not/and/or), vòng lặp, break/continue',
    code: `// ==============================================================================
// BLang Comprehensive Demonstration & Test Script
// - Khai báo biến chuẩn phong cách Python: biến = giá trị (KHÔNG CẦN let/var)
// - Hàm với tham số và return
// - Danh sách & Từ điển
// - Logic boolean (not, and, or, True, False)
// - Vòng lặp với break và continue
// - Constant folding: (10 * 5) + 2 tính trước ở compile time
// ==============================================================================

# 1. Khai báo biến trực tiếp chuẩn phong cách Python
base_score = 100;
player_name = "Nova Commander";
counter = 0;
is_mission_active = True;
hazard_level = 0;

# 2. Hàm có tham số, phạm vi cục bộ và return
function calculate_boost(base, multiplier) {
    bonus = 25;
    subtotal = (base * multiplier);
    return subtotal + bonus;
}

# 3. Danh sách và Từ điển
inventory = ["quantum_core", "shield_matrix", "plasma_drive"];
ship_stats = {
    "hull": 500,
    "shields": 250,
    "warp_ready": True
};

# 4. Constant Folding Demonstration: (10 * 5) + 2 -> 52
optimized_constant = (10 * 5) + 2;

# 5. Logic điều kiện phức hợp: not, and, or
if (not (hazard_level > 2) and (is_mission_active or base_score > 50)) {
    print(">>> System Status: GREEN. Welcome aboard,", player_name);
    boosted = calculate_boost(base_score, 2);
    print(">>> Boosted Score Total (Expected 225):", boosted);
} elseif (base_score == 0) {
    print(">>> Critical alert: Score is zero!");
} else {
    print(">>> System in standby mode.");
}

# 6. Vòng lặp while với continue và break
print("--- Starting Diagnostics Loop ---");
while (counter < 10) {
    counter += 1;
    if (counter == 3) {
        continue;
    }
    if (counter == 7) {
        print(">>> Loop encountered threshold at counter:", counter);
        break;
    }
}

# 7. Vòng lặp for-in
print("--- Scanning Inventory Systems ---");
for (item in inventory) {
    print(">>> Detected component:", item);
}

# 8. Xuất kết quả Constant Folding
print(">>> Constant folding verification (Expected 52):", optimized_constant);
print(">>> BLang test program completed successfully!");
`,
  },
  {
    id: 'dynamic-typing',
    name: 'Dynamic Typing & Coercion',
    description: 'Ghép chuỗi linh hoạt tự nhiên giữa String và Number mà không bị chặn',
    code: `// ==============================================================================
// BLang Dynamic Typing Demonstration
// ==============================================================================

$user_title = "Commander Shepard - Level ";
@level_number = 60;

// Hệ thống kiểu động tự nhiên:
// Chuỗi và số kết hợp liền mạch (String concatenation)
$player_profile = $user_title + @level_number;

print(">>> Kết quả ghép chuỗi linh hoạt:", $player_profile);

$status_log = "Processing batch #";
$status_log += 108;
print(">>> Compound assignment linh hoạt:", $status_log);
`,
  },
  {
    id: 'syntax-diagnostic',
    name: 'Syntax Diagnostic Demo',
    description: 'Minh họa bắt lỗi cú pháp chính xác theo dòng và cột',
    isErrorDemo: true,
    code: `// ==============================================================================
// BLang Syntax Diagnostic Error Demonstration
// ==============================================================================

@score = 100;
$name = "Orion";

// Cố tình thiếu dấu ngoặc nhọn kết thúc hàm để kiểm tra Parser Diagnostic
function calculate_score(@val) {
    return @val * 2;
// Thiếu dấu '}' đóng hàm ở đây
`,
  },
  {
    id: 'scientific',
    name: 'Scientific & Series Computation',
    description: 'Tính toán chuỗi Fibonacci, hàm mũ và constant folding',
    code: `// Tính toán chuỗi Fibonacci trong BLang (không cần let)
function fibonacci($n) {
    if ($n <= 1) {
        return $n;
    }
    @a = 0;
    @b = 1;
    _i = 2;
    while (_i <= $n) {
        _temp = @a + @b;
        @a = @b;
        @b = _temp;
        _i += 1;
    }
    return @b;
}

@pi_approx = 3.14159265;
_folded_scale = (2.0 * 3.14159265) / 4.0;

print("--- Fibonacci Sequence Generator ---");
for (k in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    $fib = fibonacci(k);
    print("Fibonacci(", k, ") =", $fib);
}

print("Folded coefficient:", _folded_scale);
`,
  },
  {
    id: 'game-loop',
    name: 'Game Physics & Entity Loop',
    description: 'Mô phỏng nhân vật game, trạng thái và vòng lặp quái vật',
    code: `// Game Entity Simulation trong BLang (không cần let)
@player = {
    "name": "Aura Knight",
    "hp": 100,
    "mana": 50,
    "speed": 12
};

@enemies = [
    {"type": "Goblin", "hp": 30, "power": 10},
    {"type": "Orc Warrior", "hp": 75, "power": 25},
    {"type": "Dragonling", "hp": 150, "power": 45}
];

function apply_damage($target_hp, $damage) {
    _new_hp = $target_hp - $damage;
    if (_new_hp < 0) {
        return 0;
    }
    return _new_hp;
}

print(">>> Commencing Dungeon Encounter for:", @player["name"]);
for (monster in @enemies) {
    _type = monster["type"];
    _hp = monster["hp"];
    print("Engaging foe:", _type, "| Starting HP:", _hp);

    _remaining = apply_damage(_hp, 40);
    print("Combat resolution: Foe HP reduced to:", _remaining);

    if (_remaining == 0) {
        print(">>> Target neutralized!");
    } else {
        print(">>> Target still standing, retreating tactically.");
    }
}
`,
  },
  {
    id: 'geometry-math',
    name: 'Math & Geometry Engine',
    description: 'Logarit, Căn bậc, Lượng giác độ (sin, cos, tan, cotan), Chu vi (c/C), Diện tích (s/S), Thể tích (v/V), Tròn (circle/cir), Vuông (square/sq)',
    code: `// ==============================================================================
// BLang Advanced Math & Geometry Engine
// - Logarit & Logarit tự nhiên: log(x, base), ln(x), log10(x), log2(x)
// - Căn bậc & Lũy thừa: sqrt(x), cbrt(x), root(x, n), pow(b, e)
// - Góc & Lượng giác theo độ: sin(d), cos(d), tan(d), cotan(d)
// - Chu vi (c/C), Diện tích (s/S), Thể tích (v/V):
//   + Hình tròn: circle hoặc cir (cir_c, cir_s, circle_c, circle_s, ...)
//   + Hình vuông: square hoặc sq (sq_c, sq_s, square_c, square_s, ...)
//   + Cầu (sphere_v, sphere_s), Trụ (cylinder_v), Nón (cone_v), Lập phương (cube_v)
// ==============================================================================

print("=== 1. LOGARITHM & EXPONENTIAL ===");
print("ln(e)              =", ln(E));
print("log10(1000)        =", log(1000));
print("log2(64)           =", log(64, 2));

print("=== 2. ROOTS & POWERS ===");
print("sqrt(144)          =", sqrt(144));
print("cbrt(125)          =", cbrt(125));
print("root(81, 4)        =", root(81, 4));
print("pow(2, 10)         =", pow(2, 10));

print("=== 3. GÓC & LƯỢNG GIÁC (SIN, COS, TAN, COTAN) ===");
print("sin(90 độ)         =", sin(90));
print("cos(60 độ)         =", cos(60));
print("tan(45 độ)         =", tan(45));
print("cotan(45 độ)       =", cotan(45));

print("=== 4. HÌNH TRÒN, HÌNH CẦU, HÌNH TRỤ, HÌNH NÓN ===");
@r = 5;
print("Chu vi hình tròn (cir_c, r=5)       =", cir_c(@r));
print("Diện tích hình tròn (cir_s, r=5)    =", cir_s(@r));
print("Thể tích hình cầu (sphere_v, r=3)   =", sphere_v(3));
print("Thể tích hình trụ (cylinder_v, r=3) =", cylinder_v(3, 10));
print("Thể tích hình nón (cone_v, r=3)     =", cone_v(3, 10));

print("=== 5. HÌNH VUÔNG, CHỮ NHẬT & THỂ TÍCH KHỐI ===");
print("Chu vi hình vuông (sq_c, a=6)      =", sq_c(6));
print("Diện tích hình vuông (sq_s, a=6)   =", sq_s(6));
print("Thể tích lập phương (cube_v, a=4)  =", cube_v(4));
print("Chu vi chữ nhật (rect_c, 8x5)      =", rect_c(8, 5));
print("Diện tích chữ nhật (rect_s, 8x5)   =", rect_s(8, 5));
print("Thể tích hộp chữ nhật (cuboid_v)   =", cuboid_v(4, 5, 6));

print("=== 6. HÌNH THANG & ĐA GIÁC ĐỀU ===");
print("Diện tích hình thang (trapezoid_s)  =", trapezoid_s(6, 10, 4));
print("Chu vi hình thang (trapezoid_c)     =", trapezoid_c(6, 10, 5, 5));
print("Chu vi lục giác đều (polygon_c)     =", polygon_c(6, 4));
print("Diện tích lục giác đều (polygon_s)  =", polygon_s(6, 4));

print("=== 7. HÌNH TAM GIÁC (TRI / TRIANGLE) ===");
print("Chu vi tam giác (tri_c, 3, 4, 5)    =", tri_c(3, 4, 5));
print("Diện tích tam giác (tri_s, b=6, h=4)=", tri_s(6, 4));
`,
  },
];
