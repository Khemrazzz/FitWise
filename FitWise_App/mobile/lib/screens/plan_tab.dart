import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';
import 'session_details_screen.dart';

class PlanTab extends StatefulWidget {
  const PlanTab({super.key});

  @override
  State<PlanTab> createState() => _PlanTabState();
}

class _PlanTabState extends State<PlanTab> {
  List<Map<String, dynamic>> _plans = [];
  Set<String> _completedKeys = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final plans = await supabase.from('plans').select('*').order('created_at', ascending: false);
      final completions = await supabase.from('completions').select('plan_id, day_number');
      setState(() {
        _plans = List<Map<String, dynamic>>.from(plans);
        _completedKeys = {for (final c in completions) '${c['plan_id']}:${c['day_number']}'};
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Padding(padding: const EdgeInsets.all(16), child: Text(_error!)));
    if (_plans.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No approved plan yet -- check back once your trainer approves one.', textAlign: TextAlign.center, style: TextStyle(color: FitWiseColors.muted)),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: _plans.expand((plan) {
          final days = List<Map<String, dynamic>>.from(plan['days'] as List);
          return [
            Text(plan['plan_name'] as String, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
            Text(plan['explanation'] as String? ?? '', style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
            const SizedBox(height: 8),
            ...days.map((day) {
              final key = '${plan['id']}:${day['day']}';
              final done = _completedKeys.contains(key);
              return GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => SessionDetailsScreen(plan: plan, day: day))),
                child: MobileCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Day ${day['day']} · ${day['title']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                            Text('${day['estimatedDurationMinutes']} min', style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                          ],
                        ),
                      ),
                      done ? const FitWiseStatusPill('Completed') : const Icon(Icons.chevron_right, color: FitWiseColors.muted),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
          ];
        }).toList(),
      ),
    );
  }
}
