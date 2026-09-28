import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';

class RecommendationScreen extends StatefulWidget {
  const RecommendationScreen({super.key});

  @override
  State<RecommendationScreen> createState() => _RecommendationScreenState();
}

class _RecommendationScreenState extends State<RecommendationScreen> {
  bool _loading = true;
  Map<String, dynamic>? _latest;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = supabase.auth.currentUser!.id;
    final rows = await supabase
        .from('predictions')
        .select('predicted_category, confidence, probabilities, assessments!inner(member_id)')
        .eq('assessments.member_id', userId)
        .order('created_at', ascending: false)
        .limit(1);
    setState(() {
      _latest = rows.isNotEmpty ? rows.first : null;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_latest == null) {
      return const Scaffold(body: Center(child: Text('No prediction yet.')));
    }

    final confidence = ((_latest!['confidence'] as num) * 100).round();
    final probs = Map<String, dynamic>.from(_latest!['probabilities'] as Map? ?? {});
    final others = probs.entries.where((e) => e.key != _latest!['predicted_category']).toList()
      ..sort((a, b) => (b.value as num).compareTo(a.value as num));

    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Recommended Workout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          MobileCard(
            child: Column(
              children: [
                const Text('Your predicted workout type', style: TextStyle(color: FitWiseColors.muted, fontSize: 12)),
                const SizedBox(height: 6),
                Text(_latest!['predicted_category'] as String, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: FitWiseColors.blue)),
                const SizedBox(height: 10),
                ProgressRing(percent: confidence.toDouble(), label: '$confidence%\nConfidence'),
                const SizedBox(height: 6),
                FitWiseStatusPill(confidence >= 70 ? 'High confidence' : confidence >= 40 ? 'Medium confidence' : 'Low confidence'),
              ],
            ),
          ),
          if (others.isNotEmpty)
            MobileCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Other probabilities', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  ...others.map((e) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(e.key),
                            Text('${((e.value as num) * 100).round()}%', style: const TextStyle(fontWeight: FontWeight.w800)),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          const WarningBanner('Fitness recommendation only -- not medical advice.'),
        ],
      ),
    );
  }
}
