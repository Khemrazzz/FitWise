import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';
import 'recommendation_screen.dart';
import 'session_details_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  bool _loading = true;
  String? _error;
  String _firstName = '';
  Map<String, dynamic>? _nextPlan;
  Map<String, dynamic>? _nextDay;
  int _streak = 0;
  double _adherencePct = 0;
  Map<String, dynamic>? _latestPrediction;
  String? _trainerNote;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final userId = supabase.auth.currentUser!.id;

      final profile = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
      final plans = await supabase.from('plans').select('*').order('created_at', ascending: false);
      final completions = await supabase.from('completions').select('plan_id, day_number, completed_at');
      final predictions = await supabase
          .from('predictions')
          .select('predicted_category, confidence, created_at, assessments!inner(member_id)')
          .eq('assessments.member_id', userId)
          .order('created_at', ascending: false)
          .limit(1);
      final assessment = await supabase
          .from('assessments')
          .select('trainer_notes')
          .eq('member_id', userId)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      final completedKeys = {for (final c in completions) '${c['plan_id']}:${c['day_number']}'};

      Map<String, dynamic>? nextPlan;
      Map<String, dynamic>? nextDay;
      int totalDays = 0;
      int totalCompleted = 0;
      for (final plan in plans) {
        final days = List<Map<String, dynamic>>.from(plan['days'] as List);
        totalDays += days.length;
        for (final day in days) {
          final key = '${plan['id']}:${day['day']}';
          if (completedKeys.contains(key)) {
            totalCompleted += 1;
          } else if (nextDay == null) {
            nextPlan = plan;
            nextDay = day;
          }
        }
      }

      // Streak: consecutive calendar days (ending today or yesterday) with
      // at least one completion.
      final completedDates = completions
          .map((c) => DateTime.parse(c['completed_at'] as String).toLocal())
          .map((d) => DateTime(d.year, d.month, d.day))
          .toSet();
      int streak = 0;
      var cursor = DateTime.now();
      cursor = DateTime(cursor.year, cursor.month, cursor.day);
      if (!completedDates.contains(cursor)) cursor = cursor.subtract(const Duration(days: 1));
      while (completedDates.contains(cursor)) {
        streak += 1;
        cursor = cursor.subtract(const Duration(days: 1));
      }

      setState(() {
        _firstName = ((profile?['full_name'] as String?) ?? supabase.auth.currentUser?.email ?? 'there').split(' ').first;
        _nextPlan = nextPlan;
        _nextDay = nextDay;
        _streak = streak;
        _adherencePct = totalDays > 0 ? (totalCompleted / totalDays) * 100 : 0;
        _latestPrediction = predictions.isNotEmpty ? predictions.first : null;
        _trainerNote = assessment?['trainer_notes'] as String?;
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

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Good to see you,', style: TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                  Text('$_firstName 👋', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                ],
              ),
              CircleAvatar(
                backgroundColor: FitWiseColors.blue,
                child: Text(_firstName.isNotEmpty ? _firstName[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_nextDay != null)
            MobileCard(
              blue: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Today's workout", style: TextStyle(fontSize: 12, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(_nextDay!['title'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                  const SizedBox(height: 2),
                  Text('${_nextDay!['estimatedDurationMinutes']} min', style: const TextStyle(color: Colors.white)),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white)),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => SessionDetailsScreen(plan: _nextPlan!, day: _nextDay!)),
                    ),
                    child: const Text('Start Workout'),
                  ),
                ],
              ),
            )
          else
            const MobileCard(
              child: Text('No plan yet -- check back once your trainer approves one.', style: TextStyle(color: FitWiseColors.muted)),
            ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 9,
            mainAxisSpacing: 9,
            childAspectRatio: 2.4,
            children: [
              MobileMetric(value: '$_streak', label: _streak == 1 ? 'Day streak' : 'Day streak'),
              MobileMetric(value: '${_adherencePct.round()}%', label: 'Adherence'),
            ],
          ),
          const SizedBox(height: 10),
          if (_latestPrediction != null)
            MobileCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Predicted workout type', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      ProgressRing(
                        percent: ((_latestPrediction!['confidence'] as num) * 100).toDouble(),
                        label: '${(((_latestPrediction!['confidence'] as num) * 100).round())}%',
                        size: 58,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_latestPrediction!['predicted_category'] as String, style: const TextStyle(fontWeight: FontWeight.w800)),
                            Text(
                              '${(((_latestPrediction!['confidence'] as num) * 100).round())}% confidence',
                              style: const TextStyle(color: FitWiseColors.green, fontSize: 11, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RecommendationScreen())),
                      child: const Text('View explanation'),
                    ),
                  ),
                ],
              ),
            ),
          if (_trainerNote != null && _trainerNote!.isNotEmpty)
            MobileCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Trainer message', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(_trainerNote!, style: const TextStyle(color: FitWiseColors.muted, fontSize: 13)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
