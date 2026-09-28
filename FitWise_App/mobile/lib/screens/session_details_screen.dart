import 'package:flutter/material.dart';

import '../theme.dart';
import 'active_workout_screen.dart';

class SessionDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> plan;
  final Map<String, dynamic> day;
  const SessionDetailsScreen({super.key, required this.plan, required this.day});

  @override
  Widget build(BuildContext context) {
    final exercises = List<Map<String, dynamic>>.from(day['exercises'] as List);
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Workout Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          MobileCard(
            blue: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(day['title'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                const SizedBox(height: 4),
                Text('${day['estimatedDurationMinutes']} min · ${exercises.length} exercises', style: const TextStyle(color: Colors.white)),
              ],
            ),
          ),
          MobileCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: exercises.map((e) {
                final detail = e['sets'] != null
                    ? '${e['sets']} sets x ${e['reps']} reps'
                    : e['durationMinutes'] != null
                        ? '${e['durationMinutes']} min'
                        : '';
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(color: FitWiseColors.blueSoft, borderRadius: BorderRadius.circular(10)),
                        alignment: Alignment.center,
                        child: const Icon(Icons.fitness_center, size: 18, color: FitWiseColors.blue),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e['exerciseId'] as String, style: const TextStyle(fontWeight: FontWeight.w800)),
                            if (detail.isNotEmpty) Text(detail, style: const TextStyle(fontSize: 11, color: FitWiseColors.muted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ActiveWorkoutScreen(plan: plan, day: day)),
              ),
              child: const Text('Start Workout'),
            ),
          ),
        ],
      ),
    );
  }
}
