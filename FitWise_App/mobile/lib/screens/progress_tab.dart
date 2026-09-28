import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';
import 'projected_progress_screen.dart';

class ProgressTab extends StatefulWidget {
  const ProgressTab({super.key});

  @override
  State<ProgressTab> createState() => _ProgressTabState();
}

class _ProgressTabState extends State<ProgressTab> {
  bool _loading = true;
  List<double> _weightHistory = [];
  int _completedDays = 0;
  int _totalDays = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final userId = supabase.auth.currentUser!.id;
    final assessments = await supabase
        .from('assessments')
        .select('weight_kg, created_at')
        .eq('member_id', userId)
        .order('created_at', ascending: true);
    final plans = await supabase.from('plans').select('days');
    final completions = await supabase.from('completions').select('id');

    final totalDays = plans.fold<int>(0, (sum, p) => sum + (p['days'] as List).length);

    setState(() {
      _weightHistory = assessments.map((a) => (a['weight_kg'] as num).toDouble()).toList();
      _totalDays = totalDays;
      _completedDays = completions.length;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final adherencePct = _totalDays > 0 ? (_completedDays / _totalDays) * 100 : 0.0;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          MobileCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Weight', style: TextStyle(fontWeight: FontWeight.w800)),
                if (_weightHistory.length >= 2)
                  Text(
                    '${(_weightHistory.last - _weightHistory.first) >= 0 ? '↑' : '↓'} ${(_weightHistory.last - _weightHistory.first).abs().toStringAsFixed(1)} kg',
                    style: const TextStyle(color: FitWiseColors.green, fontSize: 11, fontWeight: FontWeight.w800),
                  ),
              ],
            ),
          ),
          if (_weightHistory.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text('${_weightHistory.last.toStringAsFixed(1)} kg', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
            ),
          MobileCard(
            child: Column(
              children: [
                const Text('Adherence', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                ProgressRing(percent: adherencePct, label: '${adherencePct.round()}%\nAdherence'),
                Text('$_completedDays of $_totalDays planned days completed', style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProjectedProgressScreen())),
              child: const Text('View Projected Progress'),
            ),
          ),
        ],
      ),
    );
  }
}
