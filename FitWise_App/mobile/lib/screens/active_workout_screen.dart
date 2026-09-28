import 'dart:async';

import 'package:flutter/material.dart';

import '../theme.dart';
import 'workout_complete_screen.dart';

class ActiveWorkoutScreen extends StatefulWidget {
  final Map<String, dynamic> plan;
  final Map<String, dynamic> day;
  const ActiveWorkoutScreen({super.key, required this.plan, required this.day});

  @override
  State<ActiveWorkoutScreen> createState() => _ActiveWorkoutScreenState();
}

class _ActiveWorkoutScreenState extends State<ActiveWorkoutScreen> {
  late final List<Map<String, dynamic>> _exercises;
  int _exerciseIndex = 0;
  int _setIndex = 1;
  Timer? _timer;
  int _restSeconds = 0;
  bool _resting = false;

  @override
  void initState() {
    super.initState();
    _exercises = List<Map<String, dynamic>>.from(widget.day['exercises'] as List);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  int get _totalSets => (_exercises[_exerciseIndex]['sets'] as num?)?.toInt() ?? 1;

  void _startRest() {
    final rest = (_exercises[_exerciseIndex]['restSeconds'] as num?)?.toInt() ?? 60;
    setState(() { _resting = true; _restSeconds = rest; });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_restSeconds <= 1) {
        t.cancel();
        setState(() => _resting = false);
      } else {
        setState(() => _restSeconds -= 1);
      }
    });
  }

  void _completeSet() {
    if (_setIndex < _totalSets) {
      setState(() => _setIndex += 1);
      _startRest();
    } else {
      _nextExercise();
    }
  }

  void _nextExercise() {
    _timer?.cancel();
    if (_exerciseIndex < _exercises.length - 1) {
      setState(() { _exerciseIndex += 1; _setIndex = 1; _resting = false; });
    } else {
      _finish();
    }
  }

  void _finish() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => WorkoutCompleteScreen(plan: widget.plan, day: widget.day)),
    );
  }

  String _fmt(int seconds) => '${(seconds ~/ 60).toString().padLeft(2, '0')}:${(seconds % 60).toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final exercise = _exercises[_exerciseIndex];
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Active Workout')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            MobileCard(
              child: Column(
                children: [
                  const Icon(Icons.fitness_center, size: 60, color: FitWiseColors.blue),
                  const SizedBox(height: 6),
                  Text(exercise['exerciseId'] as String, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  Text('Exercise ${_exerciseIndex + 1} of ${_exercises.length}', style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                ],
              ),
            ),
            Row(
              children: [
                Expanded(child: MobileMetric(value: '$_setIndex / $_totalSets', label: 'Current set')),
                const SizedBox(width: 9),
                Expanded(child: MobileMetric(value: '${exercise['reps'] ?? '-'}', label: 'Rep target')),
              ],
            ),
            const SizedBox(height: 10),
            if (_resting)
              MobileCard(
                child: Column(
                  children: [
                    const Text('Rest timer', style: TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                    Text(_fmt(_restSeconds), style: const TextStyle(fontSize: 44, fontWeight: FontWeight.w900, color: FitWiseColors.blue)),
                  ],
                ),
              ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(onPressed: _nextExercise, child: const Text('Skip Exercise')),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(onPressed: _resting ? null : _completeSet, child: const Text('Complete Set')),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextButton(
              onPressed: _finish,
              child: const Text('End Workout', style: TextStyle(color: FitWiseColors.red, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
  }
}
