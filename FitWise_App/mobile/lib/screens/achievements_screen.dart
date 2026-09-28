import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';

class _Badge {
  final String emoji;
  final String title;
  final bool unlocked;
  const _Badge(this.emoji, this.title, this.unlocked);
}

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  bool _loading = true;
  int _totalWorkouts = 0;
  int _streak = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final completions = await supabase.from('completions').select('completed_at');
    final dates = completions
        .map((c) => DateTime.parse(c['completed_at'] as String).toLocal())
        .map((d) => DateTime(d.year, d.month, d.day))
        .toSet();
    int streak = 0;
    var cursor = DateTime.now();
    cursor = DateTime(cursor.year, cursor.month, cursor.day);
    if (!dates.contains(cursor)) cursor = cursor.subtract(const Duration(days: 1));
    while (dates.contains(cursor)) {
      streak += 1;
      cursor = cursor.subtract(const Duration(days: 1));
    }
    setState(() {
      _totalWorkouts = completions.length;
      _streak = streak;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final badges = [
      _Badge('🏋️', 'First Workout', _totalWorkouts >= 1),
      _Badge('🔥', 'Seven-Day Streak', _streak >= 7),
      _Badge('💪', '5 Workouts', _totalWorkouts >= 5),
      _Badge('🛡️', '10 Workouts', _totalWorkouts >= 10),
      _Badge('⚡', '25 Workouts', _totalWorkouts >= 25),
      _Badge('🏆', '50 Workouts', _totalWorkouts >= 50),
    ];

    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Achievements')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(child: MobileMetric(value: '$_streak', label: 'Day streak')),
              const SizedBox(width: 9),
              Expanded(child: MobileMetric(value: '$_totalWorkouts', label: 'Workouts')),
            ],
          ),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 9,
            mainAxisSpacing: 9,
            childAspectRatio: 1.1,
            children: badges.map((b) {
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  border: Border.all(color: FitWiseColors.line),
                  borderRadius: BorderRadius.circular(13),
                  color: FitWiseColors.surface,
                ),
                child: Opacity(
                  opacity: b.unlocked ? 1 : 0.4,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(b.unlocked ? b.emoji : '🔒', style: const TextStyle(fontSize: 34)),
                      const SizedBox(height: 6),
                      Text(b.title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                      Text(b.unlocked ? 'Unlocked' : 'Locked', style: const TextStyle(fontSize: 11, color: FitWiseColors.muted)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
