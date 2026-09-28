import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';
import 'home_shell.dart';

class WorkoutCompleteScreen extends StatefulWidget {
  final Map<String, dynamic> plan;
  final Map<String, dynamic> day;
  const WorkoutCompleteScreen({super.key, required this.plan, required this.day});

  @override
  State<WorkoutCompleteScreen> createState() => _WorkoutCompleteScreenState();
}

class _WorkoutCompleteScreenState extends State<WorkoutCompleteScreen> {
  int _rating = 4;
  bool _saving = false;

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final userId = supabase.auth.currentUser!.id;
      await supabase.from('completions').insert({
        'plan_id': widget.plan['id'],
        'member_id': userId,
        'day_number': widget.day['day'],
      });
    } finally {
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeShell()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercises = List<Map<String, dynamic>>.from(widget.day['exercises'] as List);
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Workout Complete')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            const SizedBox(height: 12),
            const Center(child: Text('🎉', style: TextStyle(fontSize: 72))),
            const SizedBox(height: 6),
            const Center(child: Text('Excellent work!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900))),
            Center(child: Text('You completed ${widget.day['title']}.', style: const TextStyle(color: FitWiseColors.muted))),
            const SizedBox(height: 14),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 9,
              mainAxisSpacing: 9,
              childAspectRatio: 2.4,
              children: [
                MobileMetric(value: '${widget.day['estimatedDurationMinutes']} min', label: 'Duration'),
                MobileMetric(value: '${exercises.length}', label: 'Exercises'),
              ],
            ),
            MobileCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('How did it feel?', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(5, (i) {
                      final filled = i < _rating;
                      return IconButton(
                        onPressed: () => setState(() => _rating = i + 1),
                        icon: Icon(filled ? Icons.star : Icons.star_border, color: const Color(0xFFF2A72D)),
                      );
                    }),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Workout'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
