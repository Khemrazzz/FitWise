import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';

class WorkoutsTab extends StatefulWidget {
  const WorkoutsTab({super.key});

  @override
  State<WorkoutsTab> createState() => _WorkoutsTabState();
}

class _WorkoutsTabState extends State<WorkoutsTab> {
  bool _loading = true;
  List<Map<String, dynamic>> _history = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final completions = await supabase.from('completions').select('plan_id, day_number, completed_at').order('completed_at', ascending: false);
    final plans = await supabase.from('plans').select('id, plan_name, days');

    final planById = {for (final p in plans) p['id'] as String: p};
    final rows = <Map<String, dynamic>>[];
    for (final c in completions) {
      final plan = planById[c['plan_id']];
      if (plan == null) continue;
      final days = List<Map<String, dynamic>>.from(plan['days'] as List);
      final day = days.firstWhere((d) => d['day'] == c['day_number'], orElse: () => {});
      rows.add({
        'title': day['title'] ?? plan['plan_name'],
        'duration': day['estimatedDurationMinutes'],
        'completedAt': DateTime.parse(c['completed_at'] as String).toLocal(),
      });
    }

    setState(() { _history = rows; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_history.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No completed workouts yet.', style: TextStyle(color: FitWiseColors.muted)),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _history.length,
        itemBuilder: (context, i) {
          final row = _history[i];
          final date = row['completedAt'] as DateTime;
          final dateStr = '${date.day}/${date.month}/${date.year}';
          return MobileCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${row['title']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                      Text('$dateStr${row['duration'] != null ? ' · ${row['duration']} min' : ''}', style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                    ],
                  ),
                ),
                const FitWiseStatusPill('Completed'),
              ],
            ),
          );
        },
      ),
    );
  }
}
