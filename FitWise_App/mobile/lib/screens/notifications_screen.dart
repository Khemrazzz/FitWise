import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';

class _Notice {
  final String title;
  final String detail;
  const _Notice(this.title, this.detail);
}

// Derived live from real data (plans, completions, trainer notes) rather
// than a persisted/dismissable feed -- same approach as the trainer web
// app's Alerts page (see app/trainer/alerts/page.tsx).
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _loading = true;
  List<_Notice> _notices = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = supabase.auth.currentUser!.id;
    final plans = await supabase.from('plans').select('id, days');
    final completions = await supabase.from('completions').select('plan_id, day_number');
    final assessment = await supabase
        .from('assessments')
        .select('trainer_notes')
        .eq('member_id', userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

    final completedKeys = {for (final c in completions) '${c['plan_id']}:${c['day_number']}'};
    int totalDays = 0;
    int completedDays = 0;
    Map<String, dynamic>? nextDay;
    for (final plan in plans) {
      final days = List<Map<String, dynamic>>.from(plan['days'] as List);
      totalDays += days.length;
      for (final day in days) {
        final key = '${plan['id']}:${day['day']}';
        if (completedKeys.contains(key)) {
          completedDays += 1;
        } else {
          nextDay ??= day;
        }
      }
    }

    final notices = <_Notice>[];
    if (nextDay != null) {
      notices.add(_Notice('Workout reminder', '${nextDay['title']} is next in your plan.'));
    }
    if (totalDays > 0 && completedDays / totalDays < 0.6) {
      notices.add(_Notice('Adherence check-in', "You're at ${((completedDays / totalDays) * 100).round()}% -- a session or two would help."));
    }
    final notes = assessment?['trainer_notes'] as String?;
    if (notes != null && notes.isNotEmpty) {
      notices.add(_Notice('Message from your trainer', notes));
    }
    if (notices.isEmpty) {
      notices.add(const _Notice('All caught up', 'No workout or adherence updates right now.'));
    }

    setState(() { _notices = notices; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Notifications')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: _notices
                  .map((n) => MobileCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text(n.detail, style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                          ],
                        ),
                      ))
                  .toList(),
            ),
    );
  }
}
