import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Design tokens ported from FitWise_POC_Demo_Package/FitWise_POC_Demo_Enhanced.html
// so the mobile app matches the approved POC visual design (see the same
// port in FitWise_App/web/app/globals.css for the trainer/member web app).
class FitWiseColors {
  static const blue = Color(0xFF1657D8);
  static const blueDark = Color(0xFF0C3EA8);
  static const blueSoft = Color(0xFFEAF1FF);
  static const teal = Color(0xFF0D9B96);
  static const tealSoft = Color(0xFFE7F8F5);
  static const green = Color(0xFF20A663);
  static const greenSoft = Color(0xFFEAF8F0);
  static const orange = Color(0xFFE98525);
  static const red = Color(0xFFDF4A50);
  static const navy = Color(0xFF10213B);
  static const ink = Color(0xFF24364F);
  static const muted = Color(0xFF6D7D91);
  static const line = Color(0xFFD9E3EF);
  static const surface = Color(0xFFFFFFFF);
  static const background = Color(0xFFF3F7FC);
}

ThemeData buildFitWiseTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: FitWiseColors.blue,
      primary: FitWiseColors.blue,
      secondary: FitWiseColors.teal,
      error: FitWiseColors.red,
      surface: FitWiseColors.surface,
    ),
    scaffoldBackgroundColor: FitWiseColors.background,
    fontFamily: GoogleFonts.inter().fontFamily,
  );

  return base.copyWith(
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: FitWiseColors.navy,
      displayColor: FitWiseColors.navy,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: FitWiseColors.surface,
      foregroundColor: FitWiseColors.navy,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: GoogleFonts.inter(
        color: FitWiseColors.blue,
        fontWeight: FontWeight.w900,
        fontSize: 20,
        letterSpacing: -0.03,
      ),
      centerTitle: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: FitWiseColors.surface,
      labelStyle: const TextStyle(color: FitWiseColors.ink, fontWeight: FontWeight.w700, fontSize: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFCBD8E7)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFCBD8E7)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: FitWiseColors.blue, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: FitWiseColors.blue,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11)),
        textStyle: const TextStyle(fontWeight: FontWeight.w800),
      ),
    ),
    cardTheme: CardThemeData(
      color: FitWiseColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(13),
        side: const BorderSide(color: FitWiseColors.line),
      ),
      margin: EdgeInsets.zero,
    ),
    dividerTheme: const DividerThemeData(color: Color(0xFFE6EDF5), thickness: 1),
  );
}

// Small reusable brand mark matching the POC's CSS-drawn equaliser-bars logo.
class FitWiseBrand extends StatelessWidget {
  final double size;
  final bool light;
  const FitWiseBrand({super.key, this.size = 22, this.light = false});

  @override
  Widget build(BuildContext context) {
    final barColor = light ? Colors.white : FitWiseColors.blue;
    final accentColor = light ? Colors.white : FitWiseColors.teal;
    Widget bar(double h) => Container(
          width: size * 0.09,
          height: size * h,
          margin: EdgeInsets.symmetric(horizontal: size * 0.02),
          decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(99)),
        );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: size,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              bar(0.35),
              bar(0.65),
              bar(0.9),
              Container(
                width: size * 0.09,
                height: size * 0.5,
                margin: EdgeInsets.symmetric(horizontal: size * 0.02),
                decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(99)),
              ),
              bar(0.9),
              bar(0.65),
              bar(0.35),
            ],
          ),
        ),
        SizedBox(width: size * 0.3),
        Text(
          'FitWise',
          style: GoogleFonts.inter(
            fontSize: size * 0.85,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.03 * size,
            color: light ? Colors.white : FitWiseColors.blue,
          ),
        ),
      ],
    );
  }
}

// Matches the POC's `.status` pill (green/warning/danger variants).
class FitWiseStatusPill extends StatelessWidget {
  final String label;
  final FitWiseStatusVariant variant;
  const FitWiseStatusPill(this.label, {super.key, this.variant = FitWiseStatusVariant.success});

  @override
  Widget build(BuildContext context) {
    final (fg, bg) = switch (variant) {
      FitWiseStatusVariant.success => (const Color(0xFF158653), FitWiseColors.greenSoft),
      FitWiseStatusVariant.warning => (const Color(0xFF9B6318), const Color(0xFFFFF3DC)),
      FitWiseStatusVariant.danger => (const Color(0xFFB3383D), const Color(0xFFFFE9EA)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w800),
      ),
    );
  }
}

enum FitWiseStatusVariant { success, warning, danger }

// Matches the POC's `.mobile-card` -- the base surface for the mobile
// screens (FitWise_POC_Demo_Package/FitWise_POC_Demo_Enhanced.html).
class MobileCard extends StatelessWidget {
  final Widget child;
  final bool blue;
  final EdgeInsetsGeometry padding;
  const MobileCard({super.key, required this.child, this.blue = false, this.padding = const EdgeInsets.all(13)});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(13),
        border: blue ? null : Border.all(color: const Color(0xFFDFE7F0)),
        gradient: blue
            ? const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [FitWiseColors.blue, Color(0xFF0C8FA5)],
              )
            : null,
        color: blue ? null : FitWiseColors.surface,
        boxShadow: const [BoxShadow(color: Color(0x0D173358), blurRadius: 13, offset: Offset(0, 5))],
      ),
      child: DefaultTextStyle.merge(
        style: TextStyle(color: blue ? Colors.white : FitWiseColors.navy),
        child: child,
      ),
    );
  }
}

// Matches the POC's `.mobile-metric` tiles used in `.mobile-row` grids.
class MobileMetric extends StatelessWidget {
  final String value;
  final String label;
  const MobileMetric({super.key, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFDFE7F0)),
        borderRadius: BorderRadius.circular(12),
        color: FitWiseColors.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(color: FitWiseColors.blue, fontSize: 17, fontWeight: FontWeight.w900)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: FitWiseColors.muted)),
        ],
      ),
    );
  }
}

// Matches the POC's `.warning-banner`.
class WarningBanner extends StatelessWidget {
  final String text;
  const WarningBanner(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E7),
        border: Border.all(color: const Color(0xFFF0D194)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(text, style: const TextStyle(color: Color(0xFF82561A), fontSize: 12)),
    );
  }
}

// Matches the POC's `.progress-ring` (a conic-gradient ring with a centered
// label) -- used for adherence/confidence rings across trainer and member UI.
class ProgressRing extends StatelessWidget {
  final double percent; // 0..100
  final String label;
  final double size;
  const ProgressRing({super.key, required this.percent, required this.label, this.size = 145});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: (percent.clamp(0, 100)) / 100,
              strokeWidth: size * 0.15,
              backgroundColor: const Color(0xFFE3EBF5),
              valueColor: const AlwaysStoppedAnimation(FitWiseColors.blue),
            ),
          ),
          Container(
            width: size * 0.7,
            height: size * 0.7,
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: FitWiseColors.navy),
            ),
          ),
        ],
      ),
    );
  }
}
